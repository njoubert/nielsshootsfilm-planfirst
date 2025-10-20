### 3.4 Blog Section (Phase 8 - Advanced Feature)

> **Defer to Phase 8**: Focus on albums first. Blog can be added later without affecting core functionality.

Planned features (Phase 8):
- Blog listing page with post cards
- Individual blog post pages
- Tag filtering and pagination
- Markdown or rich text support



#### Blog Management
- `GET /api/admin/blog` - List posts
- `POST /api/admin/blog` - Create post
- `PUT /api/admin/blog/:id` - Update post
- `DELETE /api/admin/blog/:id` - Delete post
- `POST /api/admin/blog/:id/publish` - Publish post
- `POST /api/admin/blog/:id/unpublish` - Unpublish post


#### Blog Editor
- [ ] Rich text editor (e.g., TinyMCE, Quill)
- [ ] Preview mode
- [ ] Publish/unpublish toggle
- [ ] Featured image upload

**Lit Component**
- [ ] `<blog-card>` - Blog post card for listings