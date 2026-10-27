# 產生啟動器的圖示（跟網站的 site/favicon.svg 同一個設計：深色圓角方塊上金色的「D2」）
#   powershell -File launcher/assets/make-icon.ps1
# 輸出 icon.ico（exe 的圖示，build.rs 放進 exe）和 icon-64.rgba（視窗標題列的圖示，64×64 RGBA）
Add-Type -AssemblyName System.Drawing
$dir = $PSScriptRoot

function Draw([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'; $g.Clear([System.Drawing.Color]::Transparent)
    # 圓角方塊（svg：32×32、rx 6）
    $k = $size / 32.0; $r = 6 * $k * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $r, $r, 180, 90); $path.AddArc($size - $r - 1, 0, $r, $r, 270, 90)
    $path.AddArc($size - $r - 1, $size - $r - 1, $r, $r, 0, 90); $path.AddArc(0, $size - $r - 1, $r, $r, 90, 90); $path.CloseFigure()
    $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 12, 10, 8))), $path)
    # 「D2」：Georgia 粗體，字級 15/32（小尺寸放大一點才看得清楚）
    $em = if ($size -le 16) { 17 * $k } else { 15 * $k }
    $font = New-Object System.Drawing.Font 'Georgia', $em, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $fmt = New-Object System.Drawing.StringFormat; $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
    $g.DrawString('D2', $font, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 201, 164, 92))), (New-Object System.Drawing.RectangleF 0, (0.5 * $k), $size, $size), $fmt)
    $g.Dispose()
    $bmp
}

# ICO：每個尺寸存成 PNG，再組成 ico 檔頭
$sizes = 16, 24, 32, 48, 64, 128, 256
$pngs = foreach ($s in $sizes) { $b = Draw $s; $ms = New-Object IO.MemoryStream; $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose(); , $ms.ToArray() }
$out = New-Object IO.MemoryStream; $w = New-Object IO.BinaryWriter $out
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]; $len = $pngs[$i].Length
    $w.Write([byte]($s % 256)); $w.Write([byte]($s % 256)); $w.Write([byte]0); $w.Write([byte]0)
    $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]$len); $w.Write([uint32]$offset); $offset += $len
}
foreach ($p in $pngs) { $w.Write($p) }
[IO.File]::WriteAllBytes("$dir\icon.ico", $out.ToArray())

# 視窗用的 64×64 RGBA
$b = Draw 64; $rgba = New-Object byte[] (64 * 64 * 4)
for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $c = $b.GetPixel($x, $y); $i = ($y * 64 + $x) * 4; $rgba[$i] = $c.R; $rgba[$i + 1] = $c.G; $rgba[$i + 2] = $c.B; $rgba[$i + 3] = $c.A } }
[IO.File]::WriteAllBytes("$dir\icon-64.rgba", $rgba)
$b.Dispose()
"icon.ico、icon-64.rgba"
