-- Photo storage for pet listings.
-- Paths are `<org_id>/<dog_id>/<uuid>.jpg`, so the org that owns the first
-- path segment is the only one that can write there. Reads are public: a
-- listing photo is meant to be seen, and public URLs let @nuxt/image and the
-- OG share cards fetch without a signed round-trip.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880, -- 5 MB; PhotoUploader already downscales to 720px JPEG q0.72
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy pet_photos_read on storage.objects for select
  using (bucket_id = 'pet-photos');

-- (storage.foldername(name))[1] is the leading path segment — the org id.
create policy pet_photos_insert on storage.objects for insert
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = public.my_org_id()::text
  );

create policy pet_photos_update on storage.objects for update
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = public.my_org_id()::text
  );

create policy pet_photos_delete on storage.objects for delete
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = public.my_org_id()::text
  );
