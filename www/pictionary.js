
function init(){
    //init sets up all global variables and attaches
    //events to certain DOM elements

    //global vars
    var drawing_var = document.getElementById('drawing-area');
    var draw = false;
    var context = drawing_var.getContext("2d");
    var last_point = [-1,-1];
    //our socket
    var socket = io.connect( '/pictionary.sock'
                           , { "resource": "pictionary.sock"
                             , "transports": ["xhr-polling"]
                             }
                            );

    //setup canvas context
    context.strokeStyle = '#000000';
    context.lineWidth = 5;
    context.lineCap = 'round';

    function ObjectPosition(obj) {
        //determines the offset of an element on the screen
        //returns pixels from the left and pixels from the top in an array
        var curleft = 0;
          var curtop = 0;
          if (obj.offsetParent) {
                do {
                      curleft += obj.offsetLeft;
                      curtop += obj.offsetTop;
                } while (obj = obj.offsetParent);
          }
          return [curleft,curtop];
    };

    function drawit(point1, point2, color, from_socket){
        //uses global var context which is the canvas context('2d')
        //point1 and point2 are arrays representing an x,y coordinate
        //use the canvas to draw from point1 to point2
        //if this is called from a socket, we do NOT broadcast the points
        //that would lead to an endless call loop from server -> client -> server ahhhh
        context.beginPath();
        context.moveTo(point1[0], point1[1]);
        context.lineTo(point2[0], point2[1]);
        context.strokeStyle = '#'+color;
        context.stroke();
        if(!from_socket){
            socket.emit('draw-coords', point1, point2);
        }
        return;
    };

    function clearit(from_socket){
        var temp = drawing_var.width;
        drawing_var.width = 0;
        drawing_var.width = temp;
        context = drawing_var.getContext("2d");
        context.lineWidth = 5;
        context.lineCap = 'round';
        if(!from_socket){
            socket.emit('clear', {});
        }
        return;
    };

    //global variable draw_area_offset 
    var draw_area_offset = ObjectPosition(drawing_var);

    //attach events to the canvas
    $('#drawing-area').mouseup(function(){
        draw = false;
        last_point = [-1, -1];
    });
    $('#drawing-area').mouseleave(function(){
        draw = false;
        last_point = [-1, -1]
    });
    $('#drawing-area').mousedown(function(e){
        //event to initialize drawing. Grab the x,y coords from the event
        //for point2 we add 1px to x so there is a diff between the points
        //allowing canvas to draw a line and the user sees a black dot on
        //first click
        draw = true;
        point1 = [e.pageX - draw_area_offset[0], e.pageY - draw_area_offset[1]];
        point2 = [e.pageX - draw_area_offset[0]+1, e.pageY - draw_area_offset[1]];
        color = '000000';
        last_point = point1;
        drawit(point1, point2, color, false);
    });
    $('#drawing-area').mousemove(function(e){
        //we use the last_point for point1 (set with mousedown event)
        //point2 is set from event e x,y coord
        //reset last_point to point2 after drawing
        if(draw){
            point1 = last_point; 
            point2 = [e.pageX - draw_area_offset[0], e.pageY - draw_area_offset[1]];
            color = '000000';
            drawit(point1, point2, color, false);
            last_point = point2;
        }
    });

    //make sure the offset is updated on a window resize
    $(window).resize(function(){
        draw_area_offset = ObjectPosition(drawing_var);    
    });

    //clear canvas when 'clear' button is clicked
    $('#clear-canvas').click(function(){
        clearit(false);
    });

    //websocket event, receive data which contains 2 points
    //points = {point1: [x, y], point2: [x,y]}
    socket.on('draw', drawit)

    //websocket event to clear the 
    socket.on('clear', function(data){
        clearit(true);
    });

}
