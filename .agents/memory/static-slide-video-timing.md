---
name: Static slide video timing
description: Frame-accurate timing rules for narration-led static slide videos assembled with FFmpeg.
---

Static slide video segments should be rounded up to a whole 30 fps frame and include one safety frame beyond the measured audio duration. Keep each WAV at its measured duration, let the still image run through the safety frame, and record the actual frame-rounded visual duration in the timing manifest.

**Why:** FFmpeg's `-shortest` can terminate a still-image stream a few milliseconds before the corresponding audio ends because video timestamps are quantised to frame boundaries. That can make a slide change fractionally before narration finishes.

**How to apply:** For each segment, use a visual duration of `(ceil(audioDuration * 30) + 1) / 30`, omit `-shortest` when muxing the final static segment, and verify that the video stream duration is at least the audio stream duration.