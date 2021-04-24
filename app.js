//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); //requiring mongoose package
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});//coonecting to URL where MongoDB is hosted locally & showing the flag for avoiding deprication


const itemsSchema = {
  name: String // item schema here name is the key & values is string ehich is data type of the name
};

const Item = mongoose.model("Item", itemsSchema); // creating mongoose model based on the itemsSchema
//singular version is going to be Item & creating Item with itemsSchema

//creating 3 new default items in our todolist
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
//lets put 3 item in array
const defaultItems = [item1, item2, item3];

const listSchema = { //creating listSchema
  name: String,
  items: [itemsSchema]// value is an array of itemsSchema based items
};

const List = mongoose.model("List", listSchema); //creating mongoosemodel for List


app.get("/", function(req, res) {//here home page is "/"
//we are going to find the items & send them over to list.ejs

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){//one arg is array & another is callback function if theres an array
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");//once the default items added then it will be there(home page) no matter how many time we refresh
    } else {//else I'm to render my list.ejs
      res.render("list", {listTitle: "Today", newListItems: foundItems});//"list"means list.ejs
    }
  });

});


//Creating Custom Lists using Express route Parameters
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);//here the param name will be whatever the user enters the forward slash capitalize the title of the list 
//find{} means find all then trigger the function...foundItems contains th things tht we found inside the items collection
  List.findOne({name: customListName}, function(err, foundList){//.findOneis mongoose method & find only one list
    if (!err){//if there is no error
      if (!foundList){//if there is none in foundlist
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems//reusing the defaultItems array
        });
        list.save();//saving the new list into lists collections
        res.redirect("/" + customListName); //concatenating "/" with new customListName
      } else {

        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});//newListItems corresponds to all of the found items that we passed over inside our root route & its going to be triggered when user access on homepage
      }
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem; //when the post route is triggered we can tap into something called req.body.newItem& that will refer to list.ejs's text that the user entered into the input to add the new item by clicking plus button ..That text is saved into a constant called itemName
  const listName = req.body.list;//list name means list title name like today/work/university

  const item = new Item({//mongoose model new document
    name: itemName
  });

  if (listName === "Today"){ //if the title is Today
    item.save();//that will save new item into our collections of items
    res.redirect("/");//to show the new added collection we need to redirect to home route
  } else { //it is in custom list
    List.findOne({name: listName}, function(err, foundList){//here we look for a list with the name thats equal to the listName
      foundList.items.push(item);// after getting the listname we are adding it in the foundList array
      foundList.save();//updating with new item
      res.redirect("/" + listName);//in stead of redirecting to home we redirect to which user currently input
    });
  }
});

app.post("/delete", function(req, res){//when user deletes
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;//to know which list the item came from

  if (listName === "Today") {//when we trying to delete from default list
    Item.findByIdAndRemove(checkedItemId, function(err){//findByIdAndRemove is mongoose document & it executes with callback function
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");//after deleting now it will find all of the items that we still have in our items collection & render it on the page
      }
    });
  } else {//when we the delete request commes from custom list
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){//{condition is name should be listName},{$pull from items array {then we make the query which has ID that corresponds to checkedItemId}} so we pull from otem array & item has an ID..findOne corresponds to foundList
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
