mopotent 0.1
============

mopotent is a message oriented JavaScript framework.  Central to this is the idea that components communicate with each other
and handle responses to web service requests by handling messages.  The messageBus object is a pub/sub mechanism that allows
components to publish messages that other components subscribe to listen for.  Because there is no explicit binding between
the action triggers and the action responders, mopotent is a good tool for "separation of concerns".

mopotent also aims to be a very simple framework for building UIs in JavaScript-- all without getting in the way of what
you are trying to build.  So I've tried to keep limitations and restrictions to a minimum.

Dependencies
============

mopotent depends on:

* jQuery.js
* mustache.js
* messageBus.js


Publishing Messages
===================

To publish a message, simply write:

```
messageBus.publish(<message type>, <message>);
```

where:

* <message type> : The message type (this is a string)
* <message> : The actual message (which is any JavaScript object)

Example:

```
messageBus.publish('gotMilk', { grade: "2 %", brand: "Happy Creameries" });
```

Subscribing to Receive Messages
===============================

To subscribe to receive a message, simply write:

```
messageBus.subscribe(<message type>, <context>, <handler function>);
```

where:

* <message type> : The message type (this is a string)
* <context> : The object which contains a <message type> property that is a function (i.e. <handler function>)
* <handler function> : The function to be invoked with the message, whose signature is: function (<message>)

Example:

```
var obj = {
    'gotMilk': function (milkObj) {
        console.log("Hey I got some " + milkObj.grade + " milk from " + milkObj.brand + " and it is AWESOME!");
    }
};
messageBus.subscribe('gotMilk', obj, obj.gotMilk);
```

Controllers
===========

mopotent allows for 2 types of controllers:

* visual controllers : Controllers with associated views
* non-visual controllers: Controllers that do NOT have any views but can still send and receive messages

Subscribing to Receive Messages in a Controller
===============================================

A controller can subscribe to receive messages as follows:

Invoke the addSubscription(<message type>, <handler function>) method on the controller instance.
This call will set a <message type> property on the controller instance whose value is the <handler function>.

Example:

In this example a non-visual controller is created using the mopotent.setController method call.
Then a subscription is added to the non-visual controller for all 'editCustomer' messages.

```
var nvc = mopotent.setController();
nvc.addSubscription('editCustomer', function (customer) {
    $('#nvcDump').val(JSON.stringify(customer, undefined, 2));
});
```

Controllers send messages by either of these 2 options:

* calling the messageBus.publish(<message type>, <message>) method
* invoking an HTTP request whose results are published in a message

Example of a controller issuing an HTTP GET request and publishing the response:

```
nvc.getData('/mopotent-sample-customers', 'gotCustomers');
```

In the example above, a HTTP GET request is sent to the /mopotent-sample-customers endpoint.  If the request is successful
then a 'gotCustomers' message is published with the result.  Should the request fail for any reason then a 'gotCustomers-error'
message will be published with the error.

The signatures for the calls you can make on a controller to issue such HTTP requests are:

HTTP GET:

```
<controller>.getData(<url>, <message type>)
```

HTTP PUT:

```
<controller>.putData(<url>, <data to put>, <message type>)
```

HTTP POST:

```
<controller>.postData(<url>, <data to post>, <message type>)
```

HTTP DELETE:

```
<controller>.deleteData(<url>, <message type>)
```


Views
=====

A view is a DOM element that can have attributes applied to it.  The view is controlled by a controller which is either implicitly created
(such as in the use of the -onmessage* attributes which are described below) or explicitly in code (when the mopotent.setController() method is invoked).

View Attributes
===============

The attributes of a view element are:

```
-onmessageshow
```

* Specifies the type of message that will cause the view to appear (the view will be hidden by default when this attribute is used).
* Please note that this is how a view can directly subscribe to receive a message.
* The view does NOT care what the actual message is.
* However, the view will appear when messages of the specific type are received.

```
-onmessagehide
```

* Specifies the type of message that will cause the view to disappear
* Please note that this is how a view can directly subscribe to receive a message.
* The view does NOT care what the actual message is.
* However, the view will hide when messages of the specific type are received.

```
-onmessagerepeat
```

* Specifies the type of message that will cause the view's contents to be repeated
* Please note that this is how a view can directly subscribe to receive a message.
* It will render the contents in a repeating fashion based on the contents of the message.

```
-iteratorvar
```

* Used in conjunction with the -onmessagerepeat attribute.
* Specifies the variable that represents the data in the message for the current iteration (this is used in template expressions, i.e. {{iteratorvar}})

```
-onmessage
```

* Specifies the type of message that will cause the view's contents to be rendered (without being repeated)
* Please note that this is how a view can directly subscribe to receive a message.
* It will render the contents in a non-repeating fashion based on the contents of the message.

```
-datavar
```

* Used in conjunction with the -onmessage attribute.
* Specifies the variable that represents the data in the message
* If you use -datavar with the -onmessagerepeat attribute then -datavar will still represent the data in the message as a whole (as opposed to the data of the current iteration)

In other words:

* When used with -onmessage: -datavar is the message data
* When used with -onmessagerepeat: -datavar is the message data as an Array and -iteratorvar is the current iteration in the message data Array


Examples
========

The following example shows a TABLE whose TBODY is populated by a repeater for multiple customers.

```
<table -onmessageshow="ShowtimeStart" -onmessagehide="ShowtimeStop">
    <thead>
        <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phone</th>
        </tr>
    </thead>
    <tbody -onmessagerepeat="gotCustomers" -iteratorvar="c">
        <tr onclick="messageBus.publish('editCustomer', {{c}});">
            <td>{{c.$index}}</td>
            <td>{{c.name}}</td>
            <td>{{c.phone}}</td>
        </tr>
    </tbody>
</table>
```

* {{c.$index}}  : Shows the index of the current iteration in the rendered content (where c is the iteratorvar)
* this.$controller    : The controller of this element within the view

The following example shows a DIV which is used for editing a customer.

```
<div -onmessage="editCustomer" -datavar="cust">
    Name: <input type="text" value="{{cust.name}}" /><br/>
    Age: <input type="text" value="{{cust.age}}" />
</div>
```

The following example shows a textarea that is populated by a non-visual controller.

```
<textarea id="nvcDump"></textarea>

<script type="text/javascript">
    var nvc = mopotent.setController();
    nvc.addSubscription('editCustomer', function (customer) {
        $('#nvcDump').val(JSON.stringify(customer, undefined, 2));
    });
</script>
```

Loading Views from Urls
=======================

You can either embed the view elements into your web page or, alternatively, you can load them from URLs.
In the following example, 4 views will be loaded from files in a views folder.

```
<section class="content">
</section>

<script type="text/javascript">
    var viewUrls = [
        'views/view-customer-not-logged-in.html',
        'views/view-customer-logged-in.html',
        'views/view-admin-not-logged-in.html',
        'views/view-admin-logged-in.html'
    ];
    mopotent.loadViews($('.content')[0], viewUrls, function (err) {
        if (err) {
            throw err;
            return;
        }

        // do something with the views here...
    });
</script>
```

Who Can Publish Messages?
=========================

* JavaScript code can publish messages
* Controllers can publish messages

Who Can Subscribe to Receive Messages?
======================================

* JavaScript code can subscribe to receive messages
* Controllers can subscribe to receive messages
* Views can subscribe to receive messages (using the attributes)

An important thing to note is that, whereas views can subscribe to receive messages, they cannot actually publish any messages!


Known Limitations
=================

Limitation #1: No Nesting of Views
==================================
You cannot nest views because when the outer view changes the inner views' controllers are NOT notified.
This leads to a situation where there are multiple views that are identical in the set of controllers.

The advice is that if you find yourself thinking of nesting views, you should, instead, seek to make smaller
views out of the sub-components of the larger view.  In that way, you can abide by the no-nesting-views rule.
