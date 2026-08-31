/**
 * Database types.
 *
 * Hand-maintained to mirror supabase/migrations. Once a real Supabase project
 * exists, regenerate with:
 *
 *   supabase gen types typescript --project-id <ref> --schema public \
 *     > packages/core/src/database.types.ts
 *
 * Keep this file and the migrations in sync until then.
 */

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type MemberRole = 'owner' | 'admin' | 'editor' | 'author';
export type TermKind = 'category' | 'tag';

export type SiteRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_url: string;
  locale: string;
  logo_url: string | null;
  favicon_url: string | null;
  social: Record<string, string>;
  analytics_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PostRow = {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  original_html: string | null;
  status: PostStatus;
  published_at: string | null;
  author_id: string | null;
  author_name: string | null;
  featured_image_id: string | null;
  reading_minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
  wp_post_id: number | null;
  created_at: string;
  updated_at: string;
}

export type TermRow = {
  id: string;
  site_id: string;
  kind: TermKind;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type MediaRow = {
  id: string;
  site_id: string;
  storage_path: string;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
  mime_type: string | null;
  bytes: number | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export type RedirectRow = {
  id: string;
  site_id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  created_at: string;
}

export type PostTermRow = {
  post_id: string;
  term_id: string;
}

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type SiteMemberRow = {
  site_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export type SiteSecretRow = {
  site_id: string;
  revalidate_secret: string;
  created_at: string;
  updated_at: string;
}

type Writable<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

/** Columns the database fills in for us. */
type Generated = 'id' | 'created_at' | 'updated_at';

export type Database = {
  public: {
    Tables: {
      sites: {
        Row: SiteRow;
        Insert: Writable<SiteRow, Generated | 'description' | 'locale' | 'logo_url' | 'favicon_url' | 'social' | 'analytics_id'>;
        Update: Partial<SiteRow>;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: Writable<PostRow, Generated | 'excerpt' | 'content_html' | 'original_html' | 'status' | 'published_at' | 'author_id' | 'author_name' | 'featured_image_id' | 'reading_minutes' | 'seo_title' | 'seo_description' | 'canonical_url' | 'noindex' | 'wp_post_id'>;
        Update: Partial<PostRow>;
        Relationships: [
          {
            foreignKeyName: 'posts_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_featured_image_id_fkey';
            columns: ['featured_image_id'];
            isOneToOne: false;
            referencedRelation: 'media';
            referencedColumns: ['id'];
          },
        ];
      };
      terms: {
        Row: TermRow;
        Insert: Writable<TermRow, Generated | 'description' | 'parent_id'>;
        Update: Partial<TermRow>;
        Relationships: [
          {
            foreignKeyName: 'terms_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      post_terms: {
        Row: PostTermRow;
        Insert: PostTermRow;
        Update: Partial<PostTermRow>;
        Relationships: [
          {
            foreignKeyName: 'post_terms_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_terms_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'terms';
            referencedColumns: ['id'];
          },
        ];
      };
      media: {
        Row: MediaRow;
        Insert: Writable<MediaRow, Generated | 'alt' | 'caption' | 'width' | 'height' | 'blur_data_url' | 'mime_type' | 'bytes' | 'source_url'>;
        Update: Partial<MediaRow>;
        Relationships: [
          {
            foreignKeyName: 'media_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Writable<ProfileRow, 'created_at' | 'updated_at' | 'display_name' | 'avatar_url' | 'bio'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      site_members: {
        Row: SiteMemberRow;
        Insert: Writable<SiteMemberRow, 'created_at' | 'role'>;
        Update: Partial<SiteMemberRow>;
        Relationships: [
          {
            foreignKeyName: 'site_members_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'site_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      site_secrets: {
        Row: SiteSecretRow;
        Insert: Writable<SiteSecretRow, 'created_at' | 'updated_at' | 'revalidate_secret'>;
        Update: Partial<SiteSecretRow>;
        Relationships: [
          {
            foreignKeyName: 'site_secrets_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: true;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      redirects: {
        Row: RedirectRow;
        Insert: Writable<RedirectRow, 'id' | 'created_at' | 'status_code'>;
        Update: Partial<RedirectRow>;
        Relationships: [
          {
            foreignKeyName: 'redirects_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      post_status: PostStatus;
      member_role: MemberRole;
      term_kind: TermKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
