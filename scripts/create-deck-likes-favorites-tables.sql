-- deck_likes テーブルの作成
CREATE TABLE public.deck_likes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    deck_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT deck_likes_pkey PRIMARY KEY (id),
    CONSTRAINT deck_likes_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE,
    CONSTRAINT deck_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_deck_user_like UNIQUE (deck_id, user_id)
);

-- deck_favorites テーブルの作成
CREATE TABLE public.deck_favorites (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    deck_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT deck_favorites_pkey PRIMARY KEY (id),
    CONSTRAINT deck_favorites_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE,
    CONSTRAINT deck_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_deck_user_favorite UNIQUE (deck_id, user_id)
);
