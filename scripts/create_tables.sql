-- Clients table
create table if not exists clients (
                                       id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamp default now(),
    photo_path text,
    contacts jsonb,
    notes text
    );

-- Calls (linked to clients)
create table if not exists calls (
                                     id uuid primary key default gen_random_uuid(),
    client_id uuid references clients(id) on delete cascade,
    date date not null,
    notes text
    );

-- Projects table
create table if not exists projects (
                                        id uuid primary key default gen_random_uuid(),
    title text not null,
    date date,
    location text,
    status text check (status in ('done', 'confirmed', 'planned', 'suggested', 'idea')),
    notes text
    );

-- Project-client many-to-many link
create table if not exists project_clients (
                                               project_id uuid references projects(id) on delete cascade,
    client_id uuid references clients(id) on delete cascade,
    primary key (project_id, client_id)
    );

alter table clients
    add column contacts jsonb;
alter table clients drop column if exists photos;
