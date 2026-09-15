-- ============================================================
-- Competitor catalog import (Pure Science Peptides price guide, Aug 2026)
-- Adds 5 new categories, updates 7 existing products (strength/price
-- refresh to match current market pricing), and inserts 25 new products.
-- New products use a neutral placeholder image (/images/product-placeholder.svg)
-- until real product photos are uploaded via the admin panel.
-- ============================================================

-- ---------- New categories ----------
insert into public.categories (name, slug, description) values
  ('Brain & Cognitive Research',        'cognitive-research',   'Peptides studied for cognitive performance, focus, and neuroprotection research.'),
  ('Sexual Wellness & Hormonal Research','sexual-wellness',     'Peptides studied for hormonal signaling and sexual wellness research.'),
  ('Immune & Inflammation Research',    'immune-inflammation',  'Peptides studied for immune modulation and inflammation research.'),
  ('Longevity & Cellular Health',       'longevity',            'Peptides studied for cellular health and longevity research.'),
  ('Advanced Research Compounds',       'advanced-compounds',   'Specialized and advanced peptides for research applications.')
on conflict (slug) do nothing;

-- ---------- Refresh existing overlapping products (strength/price/naming) ----------
update public.products set name = 'BPC-157 – 10mg',                 price = 69.00  where slug = 'bpc-157';
update public.products set name = 'CJC-1295 (No DAC) – 10mg',       price = 69.00  where slug = 'cjc-1295-no-dac';
update public.products set name = 'CJC-1295 with DAC – 10mg',       price = 69.00  where slug = 'cjc-1295-with-dac';
update public.products set name = 'IGF-1 LR3 – 1mg',                price = 89.00  where slug = 'igf-1-lr3';
update public.products set name = 'Retatrutide – 10mg',             price = 89.00  where slug = 'retatrutide';
update public.products set name = 'TB-500 (Thymosin Beta-4) – 10mg',price = 69.00  where slug = 'tb-500';

update public.products
set name = 'Follistatin-344 – 1mg',
    price = 199.00,
    category_id = (select id from public.categories where slug = 'advanced-compounds')
where slug = 'follistatin';

-- ---------- New products ----------
insert into public.products (name, slug, price, image_url, category_id, stock, featured, short_desc)
select v.name, v.slug, v.price, '/images/product-placeholder.svg', c.id, 100, false, v.short_desc
from (values
  -- Metabolic Health & Weight Management -> fat-loss
  ('Semaglutide – 5mg',        'semaglutide',        79.00,  'fat-loss', 'GLP-1 receptor agonist studied for metabolic and weight-management research.'),
  ('Tirzepatide – 10mg',       'tirzepatide',        99.00,  'fat-loss', 'Dual GIP/GLP-1 agonist studied in metabolic research.'),
  ('AOD-9604 – 5mg',           'aod-9604',           59.00,  'fat-loss', 'Modified fragment of human growth hormone studied for fat-metabolism research.'),
  ('5-Amino-1MQ – 10mg',       '5-amino-1mq',        99.00,  'fat-loss', 'Small molecule studied for NNMT inhibition and metabolic research.'),
  ('SLU-PP-332 – 10mg',        'slu-pp-332',         119.00, 'fat-loss', 'ERR agonist studied for exercise-mimetic metabolic research.'),

  -- Muscle Growth & Performance -> muscle-growth
  ('CJC-1295 + Ipamorelin – 10/10mg Kit', 'cjc-1295-ipamorelin-kit', 95.00, 'muscle-growth', 'Combination GHRH/GHRP kit studied for growth-hormone research.'),
  ('Ipamorelin – 10mg',        'ipamorelin',         99.00,  'muscle-growth', 'Selective growth-hormone secretagogue studied for research use.'),
  ('Tesamorelin – 10mg',       'tesamorelin',        109.00, 'muscle-growth', 'GHRH analog studied for growth-hormone and body-composition research.'),
  ('MOTS-C – 10mg',            'mots-c',             49.00,  'muscle-growth', 'Mitochondrial-derived peptide studied for metabolic and performance research.'),

  -- Recovery & Tissue Repair -> recovery
  ('Wolverine Blend – 10/10mg','wolverine-blend',    99.00,  'recovery', 'BPC-157/TB-500 combination blend studied for tissue-repair research.'),
  ('GHK-Cu – 50mg',            'ghk-cu',             79.00,  'recovery', 'Copper peptide studied for tissue-repair and skin research.'),
  ('KPV – 10mg',               'kpv',                69.00,  'recovery', 'Anti-inflammatory tripeptide studied for tissue-repair research.'),

  -- Brain & Cognitive Research -> cognitive-research
  ('Semax – 10mg',             'semax',              69.00,  'cognitive-research', 'Nootropic peptide studied for cognitive-performance research.'),
  ('Selank – 10mg',            'selank',             69.00,  'cognitive-research', 'Anxiolytic peptide studied for cognitive and stress-response research.'),
  ('Dihexa – 10mg',            'dihexa',             99.00,  'cognitive-research', 'Neurogenic compound studied for synaptic and cognitive research.'),
  ('NAD+ – 500mg',             'nad-plus',           129.00, 'cognitive-research', 'Coenzyme studied for cellular energy and cognitive research.'),

  -- Sexual Wellness & Hormonal Research -> sexual-wellness
  ('PT-141 – 10mg',            'pt-141',             49.00,  'sexual-wellness', 'Melanocortin peptide studied for sexual-wellness research.'),
  ('Kisspeptin – 10mg',        'kisspeptin',         109.00, 'sexual-wellness', 'Neuropeptide studied for reproductive-hormone research.'),
  ('Oxytocin – 10mg',          'oxytocin',           99.00,  'sexual-wellness', 'Neuropeptide studied for hormonal and behavioral research.'),

  -- Immune & Inflammation Research -> immune-inflammation
  ('Thymosin Alpha-1 – 10mg',  'thymosin-alpha-1',   99.00,  'immune-inflammation', 'Immune-modulating peptide studied for immune-response research.'),
  ('LL-37 – 10mg',             'll-37',              99.00,  'immune-inflammation', 'Antimicrobial peptide studied for immune-research applications.'),

  -- Longevity & Cellular Health -> longevity
  ('Epitalon – 10mg',          'epitalon',           59.00,  'longevity', 'Peptide studied for telomerase activity and cellular-longevity research.'),

  -- Advanced Research Compounds -> advanced-compounds
  ('ACE-031 – 10mg',           'ace-031',            99.00,  'advanced-compounds', 'Myostatin-inhibiting peptide studied for muscle research.'),
  ('Melanotan II – 10mg',      'melanotan-ii',       59.00,  'advanced-compounds', 'Melanocortin analog studied for pigmentation research.'),
  ('Sermorelin – 10mg',        'sermorelin',         69.00,  'advanced-compounds', 'GHRH analog studied for growth-hormone research.')
) as v(name, slug, price, category_slug, short_desc)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
