
// create ORDER object
class Order{
    constructor (customer_id, total_price, month, week, date, hour, year, combine_date){
        this.customer_id = customer_id;
        this.total_price = total_price;
        this.month = month;
        this.week = week;
        this.date = date;
        this.hour = hour;
        this.year = year;
        this.combine_date = combine_date;
        this.cart = [];
    }

    addDrink(drink){
        this.cart.push(drink);
    }
}


// create DRINK object
class Drink{
    constructor (order_id, beverage_info_id, beverage_name, quantity, ice_level, sweetness_level, size, price){
        this.order_id = order_id;
        this.beverage_info_id = beverage_info_id;
        this.beverage_name = beverage_name;
        this.quantity = quantity;
        this.ice_level = ice_level;
        this.sweetness_level = sweetness_level;
        this.size = size;
        this.price = price
    }
}