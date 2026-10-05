# Prerender the landing robot

`prerender-robot.mjs` renders the existing `public/spline/friendly-robot.splinecode`
locally into a lossless upper-body poster, a calm transparent body video, and
360 sharp head photographs that follow the cursor. The original rigid shoulder
groups move in a slow 10-second 30 FPS loop. The mirrored Instance parent and
internal arm/elbow geometry remain fixed to avoid disconnected shoulder edges.
The website uses native body video playback and a small 2D head canvas. It pauses
offscreen while retaining both the video position and head pose.
It does not download Spline or initialize WebGL on the landing page.

The torso and both arms use the complete original torso material settings, retaining
its woven bump map, dark matcap, Phong highlights and iridescent layer. The render
tree is traversed to include mirrored Instance meshes absent from the public
object list. Materials are updated in place to preserve Spline shape references.
A 20% contribution of the existing weave after lighting exposes the carbon
pattern on the shadowed shoulder while retaining the original black highlights.
A modest symmetric studio fill is used. Head materials and robot geometry are preserved.
The initial head looks down at 90 degrees (rotation x=0.16, y=0). The SSR poster
is assembled from headless frame 0 plus that exact head patch, avoiding a change
in body lighting when the original head is hidden for layered playback.

The offline utility needs Node.js, Playwright with Chromium, Sharp, and FFmpeg
with `libvpx-vp9` and `yuva420p` support. These
are development tools and do not need to be added to the frontend's runtime
dependencies. Point `ROBOT_RENDER_DEPENDENCIES` at an existing `node_modules`
directory containing Playwright and Sharp. If they are already available from
this project, that variable can be omitted.

Run from `Frontend`, for example in PowerShell:

```powershell
$env:ROBOT_RENDER_DEPENDENCIES = 'C:/path/to/tools/node_modules'
$env:ROBOT_RENDER_BROWSER = 'C:/path/to/chrome.exe'
$env:ROBOT_RENDER_FFMPEG = 'C:/path/to/ffmpeg.exe'
node scripts/prerender-robot.mjs
```

`ROBOT_RENDER_BROWSER` is optional when the matching Playwright Chromium is
installed. The renderer uses GPU rendering and freezes the model's camera,
pose, and timeline after the original entrance has finished. Internal Spline
render calls are confined to this offline script; the current runtime version
is `1.12.98`.

Outputs:

- `public/robot/poster-v8.webp`: the complete initial robot at 1024 × 715,
  composed from the playback layers and encoded without image compression loss.
- `public/robot/body-loop-v8.webm`: a headless VP9 body video at 1024 × 715 with
  transparency, CRF 16, 300 frames and a calm ten-second seamless loop.
- `public/robot/head-v8-t{tile}.webp`: exactly 360 directions around the extreme
  gaze ellipse, in 24 lossless tiles, each covering 15 consecutive degrees.
  For angle `a`, yaw=`0.38*cos(a)` and pitch=`0.16*sin(a)`; 0° right, 90° down,
  180° left, 270° up. There are no inner radial frames. Atlas index maps to
  angle `(index - 7 + 360) % 360`; the component maps angle back with
  `(round(angle) + 7) % 360`. Tile 0 spans 353°–7°, so the circular seam falls
  inside one tile. The initial down pose is tile 6, local column 7.
  Every head photograph is 384 × 384 native pixels. The head patch occupies
  x=320, y=0 in the complete image.
  Only two decoded tiles can be resident (16.9 MiB); evicted
  ImageBitmaps are closed. The component also retains at most eight compressed
  tile blobs (about 3 MB); immutable HTTP caching serves revisited tiles.
  Nearest photographs with eased cursor motion preserve
  sharp head outlines, and the cursor loop stops completely when settled.

Set `ROBOT_RENDER_MATERIAL_INSPECT=1` to capture `neutral-textured.png` in the scratch
directory and exit before the longer head and body export. The material edits
use internal Spline nodes only in this offline tool; review the result after
upgrading `@splinetool/runtime`.

Intermediate PNG frames and the encoded drafts are written to an OS temporary
directory. Set `ROBOT_RENDER_FRAMES_DIRECTORY` to retain them in a chosen location.
Choose a directory on a disk with at least 250 MB free for intermediate frames.
When the default OS temporary disk is nearly full, set this variable and the
child process's `TEMP` / `TMP` to a directory on another disk before exporting.
Completed assets are published atomically, so the browser cannot cache a partial
video file. FFmpeg from an existing `imageio_ffmpeg` installation is suitable;
find it using `python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`.

When changing the model or regenerating assets, bump the version suffix in
the script and `components/landing/optimized-robot-visual.tsx`.
These versioned assets use an immutable cache policy. Review the
poster, sharp hand details, transparency and loop seam after each export.
The exporter refuses to replace an existing version. The preview-only material
inspection can still run without publishing or changing those assets.
