SHOW TABLES;

select * from products;

DESCRIBE categories;

-- CATEGORY INDEX
CREATE INDEX idx_products_category
ON products(category_id);

-- BRAND INDEX
CREATE INDEX idx_products_brand
ON products(brand);

-- PRICE INDEX
CREATE INDEX idx_products_price
ON products(price);

-- PRODUCT NAME INDEX
CREATE INDEX idx_products_name
ON products(name);

-- COMPOSITE INDEX FOR AI CHAT SEARCH
CREATE INDEX idx_products_chat_search
ON products(category_id, brand, price);

-- OPTIONAL FULLTEXT SEARCH INDEX
ALTER TABLE products
ADD FULLTEXT(name, description);

ALTER TABLE categories
ADD aliases TEXT;

SHOW INDEX FROM products;

UPDATE categories
SET aliases =
',mobile,mobiles,phone,phones,smartphone,smartphones,android,'
WHERE LOWER(name) = 'smartphone';

UPDATE categories
SET aliases =
',laptop,laptops,notebook,notebooks,ultrabook,gaminglaptop,'
WHERE LOWER(name) = 'laptops';

UPDATE categories
SET aliases =
',headphone,headphones,headset,headsets,earphone,earphones,earbuds,airpods,pods,bluetoothheadset,'
WHERE LOWER(name) = 'headphones';

UPDATE categories
SET aliases =
',tv,television,televisions,smarttv,ledtv,'
WHERE LOWER(name) = 'tvs';

UPDATE categories
SET aliases =
',watch,watches,smartwatch,smartwatches,'
WHERE LOWER(name) = 'watches';

UPDATE categories
SET aliases =
',camera,cameras,dslr,'
WHERE LOWER(name) = 'cameras';

UPDATE categories
SET aliases =
',speaker,speakers,bluetoothspeaker,woofer,'
WHERE LOWER(name) = 'speakers';

UPDATE categories
SET aliases =
',shoe,shoes,sneaker,sneakers,boots,sandals,slippers,'
WHERE LOWER(name) = 'shoes';

UPDATE categories
SET aliases =
',shirt,shirts,tshirt,tshirts,hoodie,hoodies,'
WHERE LOWER(name) = 'shirts';

UPDATE categories
SET aliases =
',table,tablet,tablets,tab,androidtablet,'
WHERE LOWER(name) = 'tablets';

UPDATE categories
SET aliases =
',electronic,electronics,gadget,gadgets,device,devices,tech,'
WHERE LOWER(name) = 'electronics';

UPDATE categories
SET aliases =
',accessory,accessories,adapter,cable,charger,usbcase,cover,mousepad,keyboard,mouse,webcam,mic,microphone,'
WHERE LOWER(name) = 'accessories';

describe cart_items;

SELECT
  id,
  user_id,
  product_id,
  qty
FROM cart_items
WHERE user_id = 1;

SELECT id,name,aliases FROM categories