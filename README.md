How to setup MonggoDB
install node.js first

npm install mongodb
npm install dotenv
npm install express
npm install cors express body-parser

node mongodb\mongo_server.js

== FIREBASE STRUCTURE ==

✅ 1. users Collection → /users/{userId}
Path: /users/user_id_123

{
"email": "user@example.com",
"username": "johndoe",
"phone_number": "+60123456789",
"password": "hashed_password",
"profile_image": "mongoDB_images_id",
"is_active": true,
"points": 100,
"address": "123, Jalan ABC, KL",
"about_me": "Just a regular user"
}

✅ 2. cart_items Collection → /cart_items/{cartItemId}
Path: /cart_items/cart_item_id_001

{
"user_id": "user_id_123",
"voucher_id": "voucher_id_1",
"quantity": 2
}

Path: /cart_items/cart_item_id_002
{
"user_id": "user_id_123",
"voucher_id": "voucher_id_2",
"quantity": 1
}

✅ 3. users_voucher_list/{autoId}
{
"user_id": "/users/{userId}", // Reference
"voucher_id": "/vouchers/{voucherId}", // Reference
"added_date": "Timestamp",
"redeem": false,
"redeem_date": null
}

✅ 4.users_voucher_list/{autoId}
{
"user_id": "/users/{userId}", // Reference
"voucher_id": "/vouchers/{voucherId}", // Reference
"quantity": 1,
"total_points": 200,
"completed_date": "Timestamp"
}

✅ 5. voucher_history/{autoId}

{
"category_id": "category_id_1",
"points": 50,
"title": "RM10 McD Voucher",
"image": "mongoDB_images_id",
"description": "Get RM10 off at McDonald's",
"terms_and_condition": "Valid until 31 Dec 2025",
"is_latest": true
}

✅ 6. categories Collection → /categories/{categoryId}
Path: /categories/category_id_1
{
"name": "Food"
}

== MONGODB STRUCTURE ==

{
"type": "profile",
"user_id": "user_id_123",
"data": "<base64_or_binary_or_url>",
"created_at": { "$date": "2025-08-13T00:00:00Z" }
},

{
"type": "voucher",
"voucher_id": "voucher_id_3",
"data": "<base64_or_binary_or_url>",
"created_at": { "$date": "2025-08-13T00:00:00Z" }
}
