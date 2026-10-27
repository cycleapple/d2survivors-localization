# 把兩張截圖的同一塊區域裁下來、放大，上下並排存成一張（比較改前改後用）
#   powershell -File tools/compare-shots.ps1 <前.png> <後.png> <x> <y> <寬> <高> <輸出.png> [倍數]
param([string]$Before, [string]$After, [int]$X, [int]$Y, [int]$W, [int]$H, [string]$Out, [int]$Scale = 2)
Add-Type -AssemblyName System.Drawing
$imgs = @([Drawing.Image]::FromFile((Resolve-Path $Before)), [Drawing.Image]::FromFile((Resolve-Path $After)))
$gap = 6
$bmp = New-Object Drawing.Bitmap ($W * $Scale), ($H * $Scale * 2 + $gap)
$g = [Drawing.Graphics]::FromImage($bmp)
$g.Clear([Drawing.Color]::Red)
$g.InterpolationMode = 'NearestNeighbor'
$src = New-Object Drawing.Rectangle $X, $Y, $W, $H
for ($i = 0; $i -lt 2; $i++) {
  $dst = New-Object Drawing.Rectangle 0, ($i * ($H * $Scale + $gap)), ($W * $Scale), ($H * $Scale)
  $g.DrawImage($imgs[$i], $dst, $src, 'Pixel')
}
$bmp.Save($Out)
$imgs | ForEach-Object { $_.Dispose() }
$g.Dispose(); $bmp.Dispose()
