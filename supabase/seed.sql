-- Seed initial organization project set
-- These are the current master project values; parameter and item data should be imported separately.

insert into public.projects (name, code, description, status)
values
  ('WILL', 'WILL', 'General project master for WILL', 'active'),
  ('SV-30', 'SV-30', 'Project SV-30 procurement tracking', 'active'),
  ('VIGIL', 'VIGIL', 'Project VIGIL procurement tracking', 'active')
on conflict (name) do nothing;

-- Example of parameter data structure that can be imported later.
-- insert into public.parameters (project_id, name, description, status)
-- select id, 'Core Electronics', 'Core electronics items', 'active' from public.projects where code = 'SV-30';
--
-- insert into public.items (project_id, parameter_id, name, description, status)
-- select p.id, param.id, 'Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)', 'Compute and controller module', 'active'
-- from public.projects p
-- join public.parameters param on param.project_id = p.id and param.name = 'Core Electronics'
-- where p.code = 'SV-30';
