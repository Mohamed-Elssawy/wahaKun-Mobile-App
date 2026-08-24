# Demo photos

Six photos for showing the diagnosis flow, already on the emulator at
`/sdcard/Pictures/wahakun-demo`. Pick them from the gallery button on F-02.

Five are real report photos this model has already diagnosed, pulled out of MinIO
before `reset-reports.ps1` cleared the account. The sixth is drawn, not a photo.

| File                         | Model says                     | App shows                       |
| ---------------------------- | ------------------------------ | ------------------------------- |
| `1-pipe-damage-critical.jpg` | `Pipe_Damage` 99.47% حرجة جداً | **حرجة**, red                   |
| `2-overflow-critical.jpg`    | `Overflow` 99.46% عالية جداً   | **حرجة**, red                   |
| `3-overflow-medium.jpg`      | `Overflow` 82.58% متوسطة       | **متوسطة**, amber               |
| `4-overflow-low.jpg`         | `Overflow` 68.57% منخفضة       | **منخفضة**, blue                |
| `5-blockage-low.jpg`         | `Blockage` 93.02% منخفضة       | **منخفضة**, blue                |
| `6-not-irrigation.jpg`       | `uncertain` 55.49%             | **F-03c**, لم نتعرف على المشكلة |

Verified against `POST :8001/api/v1/predict` on 2026-08-10; the confidences above
are what it answered, so they are what the diagnosis screen will show.

Two worth knowing before the demo:

- `4-overflow-low` is 68.57%, and the service calls anything under 65% uncertain.
  It is the closest thing here to the boundary — if the model is ever retrained,
  re-check this one first.
- `6-not-irrigation` is a drawing of a door, which is the point: nothing in it is
  irrigation, so the model refuses it and F-03c answers. Photographing any wall or
  desk in the room does the same thing if you would rather show it live.

To put them back on a fresh emulator:

    adb shell mkdir -p /sdcard/Pictures/wahakun-demo
    adb push scripts/demo-photos/. /sdcard/Pictures/wahakun-demo/
    adb shell "content call --uri content://media/external/images/media --method scan_volume --arg external_primary"

The last line is what makes them appear in the gallery; without it the files are
on disk and MediaStore has never heard of them.
