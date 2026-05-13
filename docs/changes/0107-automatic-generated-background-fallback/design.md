# Design: Automatic Generated Background Fallback

## Problem

The explicit `上传图片 / 动态背景` choice works technically, but it exposes an internal rendering option the user does not need to manage.

## Goal

Make background images optional. When no image is uploaded, the app should automatically use the built-in dynamic background.

## Non-Goals

- Add new background controls.
- Remove the generated background renderer.
- Change export behavior beyond choosing the fallback automatically.

## Approach

Keep the background system introduced in the previous change, but simplify the UI. The user only sees an optional background-image upload. Preview receives the uploaded image when present; otherwise it receives the stable generated-background asset.
