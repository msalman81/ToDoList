//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const lod=require("lodash"); //lodash is used to format route strings
const app = express();

app.set('view engine', 'ejs'); //ejs is the templating used

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/listItemDB");
const itemSchema = { //each todo item will just have a string
  name: String
}
const Item = mongoose.model("Item", itemSchema);
const newListScheme = { //has a name and an array of listItems which are basically modelled on the itemSchema
  name: String,
  listItems: [itemSchema]
}
const List = mongoose.model("list", newListScheme);
//the three objects below are added to the app by default
const defaultOne = {
  name: "Buy Groceries"
}
const defaultTwo = {
  name: "Make Food"
}
const defaultThree = {
  name: "Eat Food"
}
const defaultList = [defaultOne, defaultTwo, defaultThree];





app.get("/", function(req, res) { //the home route

  const day = date.getDate();
  Item.find({}, function(err, itemList) {
    if (itemList.length === 0) {
      Item.insertMany(defaultList, function(err) { //the default items are inserted
        if (err) {
          console.log(err);
        } else {
          console.log("success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { //list.ejs is displayed with listTitle as the date today and listItems displayed below
        listTitle: day,
        newListItems: itemList
      });
    }

  });


});

app.post("/", function(req, res) { //whenever a new list item is added
  const day = date.getDate();
  const itemdata = req.body.newItem;
  const pageTitle = req.body.list;
  console.log(pageTitle);
  const item = new Item({
    name: itemdata
  });
  if (pageTitle === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: pageTitle
    }, function(err, found) {
      if (!err) {
        console.log(item);
        found.listItems.push(item);
        found.save();
        res.redirect("/" + pageTitle);
      }
    })
  }
});
app.post("/delete", function(req, res) { //this is called whenever the checkbox is ticked
  var ci = req.body.checkbox;
  const day = date.getDate();
  var pageTitle = req.body.listName;
  if (pageTitle === day) {
    Item.deleteOne({
      _id: ci
    }, function(err) {
      if (err) {
        console.log("error");
      } else {
        console.log("success");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:pageTitle},{$pull:{listItems:{_id:ci}}},function(err){ //this empties the item
      if(!err){
        res.redirect("/"+pageTitle);
      }
    })
  }
});
app.get("/:newList", function(req, res) { //this a custom url list
  const listName = lod.capitalize(req.params.newList); //captalizes the first letter of each new word
  List.findOne({
    name: listName
  }, function(err, listFound) {
    if (!err) {
      if (listFound) {
        res.render("list", {
          listTitle: listName,
          newListItems: listFound.listItems
        });
      } else {
        const newList = new List({
          name: listName,
          listItems: defaultList
        });
        newList.save();
        res.redirect("/" + listName);

      }
    }
  });
});
app.get("/work", function(req, res) { //this is the worklist
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function(req, res) { //about list
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() { //this runs on heroku and local port
  console.log("Server started on port 3000");
});
