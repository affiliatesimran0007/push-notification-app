# Push Notification Icon Requirements

## Icon Sizes and Formats

### Recommended Sizes
- **Primary Icon**: 192x192px (required)
- **Additional Sizes**: 512x512px (for high-DPI displays)
- **Badge Icon**: 72x72px (for badge/small icon)

### Format Requirements
- **Format**: PNG (recommended), JPEG, or WebP
- **Color Space**: sRGB
- **Bit Depth**: 24-bit (8 bits per channel) with optional alpha channel
- **Transparency**: Supported (recommended for better appearance)

### Platform-Specific Requirements

#### Windows
- **Minimum**: 48x48px
- **Recommended**: 256x256px or higher
- **Note**: Windows scales down large icons, so provide high-resolution images to prevent pixelation

#### macOS
- **Minimum**: 256x256px
- **Recommended**: 512x512px or 1024x1024px
- **Note**: macOS uses high-resolution displays, larger icons prevent pixelation

#### Android
- **Minimum**: 72x72px
- **Recommended**: 192x192px or higher
- **Note**: Android may display icons at various sizes

#### Chrome/Edge
- **Minimum**: 48x48px
- **Recommended**: 192x192px or higher

## Best Practices to Prevent Pixelation

1. **Use Vector Graphics Source**
   - Design icons in vector format (SVG, AI, etc.)
   - Export to PNG at required sizes

2. **Provide Multiple Sizes**
   - Include 192x192px as minimum
   - Add 512x512px for high-DPI displays
   - Consider 1024x1024px for future-proofing

3. **Sharp Edges and Clear Design**
   - Avoid thin lines (minimum 2px at 192x192)
   - Use bold, simple shapes
   - Test at small sizes

4. **Optimization**
   - Use PNG optimization tools (TinyPNG, ImageOptim)
   - Keep file size under 100KB
   - Maintain quality over compression

## Implementation in Code

```javascript
// In your manifest.json or PWA config
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Testing Your Icons

1. Test on actual devices, not just browser DevTools
2. Check on both standard and high-DPI displays
3. Verify appearance in notification center/tray
4. Test with light and dark system themes

## Common Issues and Solutions

### Pixelation
- **Cause**: Icon too small or low resolution
- **Solution**: Use 512x512px or larger source image

### Blurry Icons
- **Cause**: Upscaling from small source
- **Solution**: Provide native resolution icons

### Cut-off Icons
- **Cause**: Important details too close to edges
- **Solution**: Add 10% padding around icon content