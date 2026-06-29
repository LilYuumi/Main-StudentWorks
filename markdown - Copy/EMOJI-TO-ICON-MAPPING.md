# Emoji to Lucide Icon Mapping

## Completed Replacements

### Klien Dashboard ✅
- 💡 → `<i data-lucide="lightbulb">`
- 🟡 → `<i data-lucide="clock">` (pending status)
- 🟢 → `<i data-lucide="lock">` (locked funds)
- ✅ → `<i data-lucide="check-circle">` (released funds)
- ↩️ → `<i data-lucide="arrow-left-circle">` (refunded)
- 📎 → `<i data-lucide="paperclip">` (attachments)
- 🖼️ → `<i data-lucide="image">` (image files)
- 📄 → `<i data-lucide="file-text">` (PDF files)
- 🎨 → `<i data-lucide="palette">` (design files)
- 💬 → `<i data-lucide="message-circle">` (chat)
- ✕ → `<i data-lucide="x-circle">` (cancel)
- ⚠️ → `<i data-lucide="alert-triangle">` (warning)
- ★ → `<i data-lucide="star">` (ratings)

## Remaining Files to Update

### Mahasiswa Dashboard
- ⚠️ → `alert-triangle` (exam warning)
- 🔥 → `flame` (positive metrics)
- ⚠️ → `alert-triangle` (negative metrics)
- 💬 → `message-circle` (chat button)
- 📎 → `paperclip` (file uploads)
- ✕ → `x-circle` (cancel button)

### Mahasiswa Proyek
- 📚 → `book-open` (exam period badge)
- ✓ → `check` (quality test badge)
- 📋 → `clipboard` (SLA rules header)
- ⚠️ → `alert-triangle` (consequence statement)
- 📚 → `book-open` (exam warning)

### Chat Index
- 📎 → `paperclip` (file label)
- 🖼️ → `image` (image files)
- 📄 → `file-text` (PDF files)
- 📝 → `file-edit` (document files)
- 📦 → `package` (archive files)
- 🎨 → `palette` (design files)

### Admin Dashboard
- ⚠️ → `alert-triangle` (safe zone warning)
- ✅ → `check-circle` (safe zone inactive)

### Klien Proyek Baru
- 📋 → `clipboard-list` (form sections)

### Klien Talenta
- ⚠️ → `alert-triangle` (safe zone indicator)

## Icon Size Guidelines

- **Small icons (inline text):** `w-3 h-3`
- **Regular icons (buttons, labels):** `w-4 h-4`
- **Medium icons (headings):** `w-5 h-5`  
- **Large icons (feature boxes):** `w-6 h-6` or larger

## Color Guidelines

- **Blue icons:** `text-idb-blue`
- **Orange icons:** `text-idb-orange`
- **Green icons:** `text-green-600`
- **Red icons:** `text-red-600`
- **Amber/Yellow icons:** `text-amber-600`
- **Gray icons:** `text-gray-500`

## Fill for Star Icons

For filled stars (ratings), use both `text-yellow-400` and `fill-yellow-400` classes.

## Usage Pattern

```html
<!-- Icon with text -->
<div class="flex items-center gap-2">
  <i data-lucide="icon-name" class="w-4 h-4 text-idb-blue"></i>
  <span>Label Text</span>
</div>

<!-- Icon button -->
<button class="flex items-center gap-1">
  <i data-lucide="icon-name" class="w-4 h-4"></i>
  Button Text
</button>

<!-- Always call lucide.createIcons() after dynamic content insertion -->
<script>
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
</script>
```

## Complete Lucide Icon Reference

Common icons used in StudentWorks:

- `lightbulb` - Tips, ideas
- `alert-triangle` - Warnings
- `check-circle` - Success, completion
- `x-circle` - Cancel, close
- `clock` - Pending, waiting
- `lock` - Secured, locked
- `unlock` - Released, unlocked
- `arrow-left-circle` - Refund, return
- `message-circle` - Chat, messages
- `paperclip` - Attachments
- `file` - Generic file
- `file-text` - Document, PDF
- `image` - Image file
- `palette` - Design file
- `package` - Archive
- `file-edit` - Editable document
- `star` - Rating
- `flame` - Achievement, positive
- `book-open` - Academic, study
- `clipboard` - List, rules
- `clipboard-list` - Form, checklist
- `calendar` - Date, schedule
- `user` - Person, profile
- `users` - Team, group
- `briefcase` - Project, work
- `folder` - Directory
- `folder-plus` - Create project
- `settings` - Configuration
- `search` - Search function
- `filter` - Filter options
- `download` - Download
- `upload` - Upload
- `eye` - View, preview
- `edit` - Edit function
- `trash` - Delete
