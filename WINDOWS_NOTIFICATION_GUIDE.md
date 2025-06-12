# Windows Push Notification Guide

## Types of Notifications on Windows PC

### 1. **Toast Notifications (Standard)**
- Appear in the bottom-right corner (Action Center)
- Stay for ~5 seconds by default
- Move to Action Center after dismissal
- Support rich content and actions

### 2. **Persistent/Sticky Notifications**
- Remain visible until user interacts
- Set with `requireInteraction: true`
- Useful for important alerts

### 3. **Silent Notifications**
- No sound or visual popup
- Only appear in Action Center
- Set with `silent: true`

## Web Push Notification Limitations & Customization

### Text Limits

#### **Title**
- **Recommended**: 50 characters
- **Max display**: ~65 characters (truncated with "...")
- **Best practice**: Keep under 40 characters for mobile

#### **Body/Message**
- **Recommended**: 120 characters  
- **Max display**: ~200 characters (4 lines on desktop)
- **Mobile**: ~40-50 characters per line
- **Truncated** with "..." if too long

### Visual Elements

#### **Icon**
- **Size**: 192x192px recommended (minimum 48x48px)
- **Format**: PNG, JPG, GIF (static)
- **Fallback**: Browser/site icon if not specified
- **Position**: Left side of notification

#### **Badge** (Mobile only)
- **Size**: 96x96px recommended
- **Format**: PNG (monochrome preferred)
- **Purpose**: Status bar/notification tray icon
- **Desktop**: Not displayed on Windows

#### **Image/Hero Image**
- **Size**: 1350x900px max (4:3 or 16:9 ratio)
- **Recommended**: 720x480px
- **Format**: PNG, JPG
- **Display**: Below text content
- **Note**: Not all browsers support (Chrome/Edge do)

### Action Buttons

#### **Limitations**
- **Maximum**: 2 buttons on desktop
- **Mobile**: Often shows only 1 or none
- **Text limit**: ~20 characters per button
- **Icons**: 128x128px (optional, Chrome only)

#### **Example**
```javascript
actions: [
  {
    action: 'view',
    title: 'View Details',
    icon: '/icons/view-128.png'
  },
  {
    action: 'dismiss',
    title: 'Dismiss',
    icon: '/icons/close-128.png'
  }
]
```

### Advanced Options

#### **Tag**
- Groups notifications with same tag
- New notification replaces old one
- Useful for update scenarios

#### **Renotify**
- Vibrate/sound again when replacing
- Works with tag parameter

#### **Timestamp**
- Custom time display
- Shows relative time (e.g., "2 hours ago")

#### **Dir** (Direction)
- Text direction: 'ltr', 'rtl', 'auto'
- For international support

#### **Vibrate** (Mobile)
- Pattern: [200, 100, 200] (ms)
- Not supported on desktop

#### **Sound**
- Custom sound URL (limited support)
- Most browsers use system default

### Windows-Specific Behavior

#### **Action Center Integration**
- All notifications go to Action Center
- Grouped by app/domain
- Can be cleared individually or all at once

#### **Focus Assist**
- Windows feature that blocks notifications
- Priority mode allows only important apps
- Alarms only mode blocks all

#### **Notification Settings**
- Per-site permissions in Windows Settings
- Sound on/off per site
- Priority levels (Top, High, Normal)

## Code Example: Maximum Customization

```javascript
const options = {
  // Text content
  title: 'New Sale: 50% Off Everything!', // 30 chars
  body: 'Limited time offer ends tonight at midnight. Shop now and save big on all items!', // 82 chars
  
  // Visual elements
  icon: '/images/icon-192x192.png',
  badge: '/images/badge-96x96.png',
  image: '/images/hero-720x480.jpg',
  
  // Behavior
  tag: 'sale-notification',
  renotify: true,
  requireInteraction: false,
  silent: false,
  
  // Additional data
  timestamp: Date.now(),
  data: {
    url: 'https://example.com/sale',
    campaignId: 'summer-sale-2024'
  },
  
  // Actions (Desktop only)
  actions: [
    {
      action: 'shop-now',
      title: 'Shop Now',
      icon: '/images/shop-icon-128.png'
    },
    {
      action: 'later',
      title: 'Remind Later',
      icon: '/images/clock-icon-128.png'
    }
  ],
  
  // Mobile specific
  vibrate: [200, 100, 200],
  dir: 'auto'
};

registration.showNotification(title, options);
```

## Best Practices for Windows

### 1. **Text Optimization**
- Front-load important information
- Use action words in title
- Keep body text scannable

### 2. **Visual Hierarchy**
- High-contrast icons (works on light/dark themes)
- Clear, recognizable imagery
- Consistent brand colors

### 3. **Timing**
- Respect Windows Quiet Hours
- Avoid notification fatigue
- Consider time zones

### 4. **Actionability**
- Clear CTA in buttons
- Meaningful tag grouping
- Proper click handling

### 5. **Fallbacks**
- Handle permission denied gracefully
- Provide in-app alternatives
- Test without images/actions

## Platform Differences

| Feature | Windows (Chrome/Edge) | macOS Safari | Android Chrome | iOS Safari (16.4+) |
|---------|---------------------|--------------|----------------|-------------------|
| Title | 65 chars | 50 chars | 40 chars | 50 chars |
| Body | 200 chars | 150 chars | 90 chars | 150 chars |
| Icon | ✅ 192x192px | ✅ 192x192px | ✅ 192x192px | ✅ 192x192px |
| Badge | ❌ | ❌ | ✅ 96x96px | ❌ |
| Image | ✅ 720x480px | ❌ | ✅ 450x300px | ❌ |
| Actions | ✅ 2 buttons | ❌ | ✅ 2 buttons | ❌ |
| Persist | ✅ | ✅ | ✅ | ❌ |
| Sound | System only | ✅ Custom | System only | System only |

## Testing Recommendations

1. **Test truncation** at different character lengths
2. **Verify images** load and display correctly
3. **Check action buttons** functionality
4. **Test with Focus Assist** on/off
5. **Verify Action Center** grouping
6. **Test on multiple DPI** settings (100%, 125%, 150%)
7. **Dark/Light theme** compatibility