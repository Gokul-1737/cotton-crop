
import torch
import torch.nn as nn
import torch.nn.functional as F


# 1. Convolution Block
class ConvBlock(nn.Module):

    def __init__(self, in_channels, out_channels,
                 kernel_size=3, stride=1, padding=1):

        super().__init__()

        self.block = nn.Sequential(
            nn.Conv2d(
                in_channels, out_channels,
                kernel_size, stride, padding,
                bias=False
            ),
            nn.BatchNorm2d(out_channels),
            nn.SiLU(inplace=True)
        )

    def forward(self, x):
        return self.block(x)


# 2. Morphology Descriptor Encoder
class MorphologyEncoder(nn.Module):

    def __init__(self, channels):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Linear(channels * 3, channels),
            nn.SiLU(inplace=True),
            nn.Linear(channels, channels),
            nn.SiLU(inplace=True)
        )

    def forward(self, x):

        mean = x.mean(dim=(2, 3))

        std = torch.sqrt(
            x.var(dim=(2, 3), unbiased=False) + 1e-6
        )

        dx = torch.abs(x[:, :, :, 1:] - x[:, :, :, :-1])
        dy = torch.abs(x[:, :, 1:, :] - x[:, :, :-1, :])

        gradient_x = dx.mean(dim=(2, 3))
        gradient_y = dy.mean(dim=(2, 3))

        gradient = (gradient_x + gradient_y) / 2

        descriptor = torch.cat(
            [mean, std, gradient], dim=1
        )

        return self.encoder(descriptor)


# 3. Adaptive Receptive Field
class AdaptiveReceptiveField(nn.Module):

    def __init__(self, channels):
        super().__init__()

        self.branch1 = ConvBlock(
            channels, channels, 3, 1, 1
        )

        self.branch2 = nn.Sequential(
            nn.Conv2d(
                channels, channels,
                kernel_size=3,
                padding=2,
                dilation=2,
                bias=False
            ),
            nn.BatchNorm2d(channels),
            nn.SiLU(inplace=True)
        )

        self.branch3 = ConvBlock(
            channels, channels, 5, 1, 2
        )

        self.morph_encoder = MorphologyEncoder(channels)

        self.gate = nn.Sequential(
            nn.Linear(channels, channels // 2),
            nn.SiLU(inplace=True),
            nn.Linear(channels // 2, 3)
        )

    def forward(self, x):

        f1 = self.branch1(x)
        f2 = self.branch2(x)
        f3 = self.branch3(x)

        descriptor = self.morph_encoder(x)

        weights = F.softmax(
            self.gate(descriptor), dim=1
        )

        w1 = weights[:, 0].view(-1, 1, 1, 1)
        w2 = weights[:, 1].view(-1, 1, 1, 1)
        w3 = weights[:, 2].view(-1, 1, 1, 1)

        fused = w1 * f1 + w2 * f2 + w3 * f3

        return fused, weights


# 4. Morphology-Guided Feature Modulation
class MorphologyGuidedModulation(nn.Module):

    def __init__(self, channels):
        super().__init__()

        self.channel_attention = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(channels, channels // 4, 1),
            nn.SiLU(inplace=True),
            nn.Conv2d(channels // 4, channels, 1),
            nn.Sigmoid()
        )

        self.spatial_attention = nn.Sequential(
            nn.Conv2d(
                2, 1, kernel_size=7,
                padding=3, bias=False
            ),
            nn.Sigmoid()
        )

    def forward(self, x):

        channel_weights = self.channel_attention(x)

        channel_refined = x * channel_weights

        avg_map = channel_refined.mean(
            dim=1, keepdim=True
        )

        max_map = channel_refined.max(
            dim=1, keepdim=True
        )[0]

        spatial_input = torch.cat(
            [avg_map, max_map], dim=1
        )

        spatial_weights = self.spatial_attention(
            spatial_input
        )

        refined = channel_refined * spatial_weights

        return refined + x


# 5. Residual Refinement
class ResidualRefinement(nn.Module):

    def __init__(self, channels):
        super().__init__()

        self.conv1 = ConvBlock(channels, channels)

        self.conv2 = nn.Sequential(
            nn.Conv2d(
                channels, channels, 3,
                padding=1, bias=False
            ),
            nn.BatchNorm2d(channels)
        )

    def forward(self, x):

        residual = x

        x = self.conv1(x)
        x = self.conv2(x)

        return F.silu(x + residual)


# 6. Complete MORPH-CNN
class MORPH_CNN(nn.Module):

    def __init__(self, num_classes=5):
        super().__init__()

        self.stem = nn.Sequential(
            ConvBlock(3, 32, 3, 2, 1),
            ConvBlock(32, 32),
            nn.MaxPool2d(2)
        )

        self.stage1 = nn.Sequential(
            ConvBlock(32, 64, stride=2),
            ResidualRefinement(64)
        )

        self.stage2 = nn.Sequential(
            ConvBlock(64, 128, stride=2),
            ResidualRefinement(128)
        )

        self.adaptive_rf = AdaptiveReceptiveField(128)

        self.modulation = MorphologyGuidedModulation(128)

        self.refinement = ResidualRefinement(128)

        self.pool = nn.AdaptiveAvgPool2d(1)

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.4),
            nn.Linear(128, 64),
            nn.SiLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes)
        )

    def forward(self, x, return_aux=False):

        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)

        x, branch_weights = self.adaptive_rf(x)

        x = self.modulation(x)
        x = self.refinement(x)

        x = self.pool(x)

        output = self.classifier(x)

        if return_aux:
            return output, branch_weights

        return output
