import { MenuItem, Coupon } from "../types";

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    "id": "item_1790140956815",
    "name": "4 cupTea",
    "category": "BEVERAGES",
    "categories": [
      "BEVERAGES",
      "All Time"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 60,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791651857703-89ec2035-2eb8-48f1-9d5e-fd7c647a6cfb.jpg",
    "rating": 5,
    "ratingCount": 2,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": [
      {
        "variantId": "v_1791697853824",
        "name": "Green Tea(S)",
        "price": 60
      },
      {
        "price": 60,
        "name": "Green Tea(w/oS)",
        "variantId": "v_1791697876412"
      },
      {
        "name": "Milk Tea(S)",
        "price": 60,
        "variantId": "v_1791697903444"
      },
      {
        "name": "Milk Tea(w/oS)",
        "variantId": "v_1791697994747",
        "price": 60
      },
      {
        "variantId": "v_1791698015234",
        "price": 60,
        "name": "Black Tea(S)"
      },
      {
        "variantId": "v_1791698029077",
        "price": 60,
        "name": "Black Tea(w/oS)"
      }
    ]
  },
  {
    "id": "item_1790140994074",
    "name": "Veg Thali",
    "category": "LUNCH",
    "categories": [
      "LUNCH"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 190,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791362626983-68cd72c6-6f3d-42ea-8baf-167da4cbc581.jpg",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790242911081",
    "name": "Coffee Hot and Cold",
    "category": "All Time",
    "categories": [
      "All Time",
      "Beverages"
    ],
    "description": "4 number of boiled egg with himalayan pink salt and back salt",
    "price": 80,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791693494700-dd1c9377-acc9-44c2-a556-c3e004f39653.jpg",
    "rating": 4.75,
    "ratingCount": 4,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": [
      {
        "price": 100,
        "name": "2 cup cold",
        "variantId": "v_1791693610547"
      },
      {
        "name": "4 cup hot",
        "price": 100,
        "variantId": "v_1791693623646"
      }
    ]
  },
  {
    "id": "item_1790243583678",
    "name": "Egg Roll",
    "category": "SNACKS",
    "categories": [
      "SNACKS"
    ],
    "description": "2 piece Egg Roll",
    "price": 120,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791428532737-a3cff655-60dc-4f3d-8222-70e9d860c0d5.png",
    "rating": 5,
    "ratingCount": 2,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": true,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790321362149",
    "name": "Roti Sabji",
    "category": "BREAKFAST",
    "categories": [
      "BREAKFAST"
    ],
    "description": "4 pieces of roti with seasonal sabji",
    "price": 60,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791362762450-841f2099-4d71-4fe3-97a7-f5309eb21adc.jpg",
    "rating": 5,
    "ratingCount": 2,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790321466215",
    "name": "Chicken Roti",
    "category": "DINNER",
    "categories": [
      "DINNER"
    ],
    "description": "4 pieces of Roti and 2 pieces of chicken",
    "price": 100,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791362854921-006edce0-5f9a-4854-a483-2abadc773701.jpg",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790321666653",
    "name": "Chicken Biryani",
    "category": "DINNER",
    "categories": [
      "DINNER"
    ],
    "description": "1 piece Chicken 1 piece egg spicial biriyani ",
    "price": 150,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791424357362-0de98fb4-1f1c-4af2-ac08-685729631bb0.jpg",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790609967715",
    "name": "cold drink",
    "category": "BEVERAGES",
    "categories": [
      "BEVERAGES"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 50,
    "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790753895208",
    "name": "Bread Butter and Egg",
    "category": "BREAKFAST",
    "categories": [
      "BREAKFAST"
    ],
    "description": "4 pieces of bread with amul butter and 2 pieces boiled egg",
    "price": 80,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791363125569-35f9c173-f4d2-4a91-acc7-1861baa30394.jpg",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": true,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790753945254",
    "name": "Chicken Thali",
    "category": "LUNCH",
    "categories": [
      "LUNCH"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 150,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791363476982-bfcb0932-d124-4802-96a6-6fe76249ff46.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790753986825",
    "name": "Puri Sabji",
    "category": "BREAKFAST",
    "categories": [],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 60,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791363265716-cc255c19-8213-4080-89c5-9c2c865f8316.jpg",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790754304053",
    "name": "Fish sabji Thali",
    "category": "LUNCH",
    "categories": [],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 120,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791363400608-432ca185-bd62-4fcc-9d0e-7025231b84bb.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790912464305",
    "name": "Egg Chicken Roll",
    "category": "SNACKS",
    "categories": [
      "SNACKS"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 100,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791424581055-494ac4b7-6a79-4d2d-98d6-6de635a558fa.png",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790912688680",
    "name": "Chicken Pokoda",
    "category": "SNACKS",
    "categories": [
      "SNACKS"
    ],
    "description": "8 pieces of chicken pokoda",
    "price": 150,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791424707282-b917a393-3b66-44b6-a961-f7cd941b80b3.png",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790912876103",
    "name": "Fish Pakoda",
    "category": "SNACKS",
    "categories": [
      "SNACKS"
    ],
    "description": "8 pieces of fish pokoda",
    "price": 160,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791424652437-cafe9fdb-4baf-44fb-b8ac-a47b287c7675.png",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1790914562031",
    "name": "Idli Sambar & Chutney",
    "category": "BREAKFAST",
    "categories": [],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 60,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791424497541-dc946105-849a-43bf-bd04-2ff36c7d2cc8.png",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1791041518882",
    "name": "Fruit sprouts",
    "category": "BREAKFAST",
    "categories": [],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 80,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791428636689-0808407b-55c9-46c8-b539-1326a4f1db08.png",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1791120421644",
    "name": "Rice",
    "category": "GROCERY_KITCHEN",
    "categories": [
      "GROCERY_KITCHEN"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 500,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791171661233-22dc7c09-a03e-480d-81b9-d1789a2f2786.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": [
      {
        "variantId": "v_1791289820883",
        "name": "1 Kg",
        "price": 100
      },
      {
        "price": 200,
        "name": "2kg",
        "variantId": "v_1791289832562"
      },
      {
        "price": 450,
        "name": "5kg",
        "variantId": "v_1791289847283"
      }
    ]
  },
  {
    "id": "item_1791429841380",
    "name": "Thumsup",
    "category": "BEVERAGES",
    "categories": [
      "BEVERAGES",
      "All Time"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 20,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791429701819-69464624-73a9-448b-a8d0-c567a6739250.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": [
      {
        "variantId": "v_1791429805388",
        "name": "200ml",
        "price": 20
      },
      {
        "variantId": "v_1791429811641",
        "price": 40,
        "name": "500ml"
      },
      {
        "price": 60,
        "variantId": "v_1791429821652",
        "name": "1L"
      }
    ]
  },
  {
    "id": "item_1791517764888",
    "name": "Egg chicken biryani",
    "category": "DINNER",
    "categories": [
      "DINNER"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 180,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791517688916-2fa454f2-66cd-4c7f-aba5-cfabce53f018.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1791558535853",
    "name": "Fruit Lassi",
    "category": "DESSERTS",
    "categories": [
      "DESSERTS",
      "All Time"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 60,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791558450824-73ee7c69-a809-4995-b5f7-01ffa63806d1.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1791558613325",
    "name": "Corn Chat",
    "category": "SNACKS",
    "categories": [],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 50,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791558583863-c1480f22-e54c-437b-abf8-e53419e8034b.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1791652062969",
    "name": "Rasmalai",
    "category": "DESSERTS",
    "categories": [
      "DESSERTS",
      "All Time"
    ],
    "description": "Soft, spongy cottage-cheese dumplings soaked in rich, creamy saffron-flavoured milk, topped with pistachios, almonds, and delicate saffron strands. A deliciously chilled and indulgent Indian dessert.",
    "price": 120,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791652386844-c2aa146b-07ec-4c01-821f-99b8ff77858e.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": []
  },
  {
    "id": "item_1791653076821",
    "name": "Sprite",
    "category": "BEVERAGES",
    "categories": [
      "BEVERAGES",
      "All Time"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 50,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791429645116-0e295f43-abb8-4d47-af03-299ae67b4239.jpg",
    "rating": 0,
    "ratingCount": 10,
    "dietary": "veg",
    "isVeg": true,
    "isEgg": false,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": [
      {
        "price": 50,
        "name": "500ml",
        "variantId": "v_1791653056355"
      }
    ]
  },
  {
    "id": "item_1791693438258",
    "name": "Boiled Egg",
    "category": "All Time",
    "categories": [
      "All Time"
    ],
    "description": "Freshly cooked homestyle dish prepared with pure ingredients.",
    "price": 80,
    "imageUrl": "https://www.image2url.com/r2/default/images/1791518108267-aa21e92e-5004-46c6-bde5-80ef94711606.jpg",
    "rating": 5,
    "ratingCount": 1,
    "dietary": "non-veg",
    "isVeg": false,
    "isEgg": true,
    "available": true,
    "prepTimeMinutes": 20,
    "variants": [
      {
        "variantId": "v_1791693413201",
        "name": "half plate",
        "price": 80
      },
      {
        "variantId": "v_1791693430792",
        "name": "full plate",
        "price": 150
      }
    ]
  }
];

export const COUPONS: Coupon[] = [
  {
    "code": "WELCOME100",
    "title": "WELCOME100",
    "subtitle": "₹100 OFF",
    "minOrder": 200,
    "discountType": "flat",
    "discountValue": 100,
    "description": "Flat ₹100 discount on orders above ₹200"
  },
  {
    "code": "BHUMI50",
    "title": "BHUMI50",
    "subtitle": "20% OFF",
    "minOrder": 199,
    "discountType": "percentage",
    "discountValue": 20,
    "description": "20% instant discount up to ₹80 on orders above ₹199"
  },
  {
    "code": "FREEDEL",
    "title": "FREEDEL",
    "subtitle": "Free Delivery",
    "minOrder": 149,
    "discountType": "flat",
    "discountValue": 30,
    "description": "Free doorstep delivery on orders above ₹149"
  }
];
