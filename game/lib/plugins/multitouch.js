ig.module( 'plugins.multitouch' )
.requires(
  'impact.game',
  'impact.input'
)
.defines(function() {

  ig.Input.inject({
    
    touches: {},
    delayedTouchUp: [],

    // unfortunally we have to overwrite this function completly without calling this.parent()
    // the touch events provided by impact get in the way so better drop them
    // this could lead to some inkompatibility, so keep that in mind when updating impact
    initMouse: function() {
      if( this.isUsingMouse ) { return; }
      this.isUsingMouse = true;

      // This works with the iOSImpact, too
      // Just remeber to copy the provided JS_TouchInput.h and JS_TouchInput.m
      if ( typeof( ios ) != 'undefined' ) {
        this._touchInput = new native.TouchInput();
    
        this._touchInput.touchStart( this.multiTouchStart.bind(this) );
        this._touchInput.touchEnd( this.multiTouchEnd.bind(this) );
        this._touchInput.touchMove( this.multiTouchMove.bind(this) );
      }
      else {
        var mouseWheelBound = this.mousewheel.bind(this);
        ig.system.canvas.addEventListener('mousewheel', mouseWheelBound, false );
        ig.system.canvas.addEventListener('DOMMouseScroll', mouseWheelBound, false );
        
        ig.system.canvas.addEventListener('contextmenu', this.contextmenu.bind(this), false );
        ig.system.canvas.addEventListener('mousedown', this.keydown.bind(this), false );
        ig.system.canvas.addEventListener('mouseup', this.keyup.bind(this), false );
        ig.system.canvas.addEventListener('mousemove', this.mousemove.bind(this), false );

        ig.system.canvas.addEventListener( 'touchstart', this.touchEvent.bind( this ), false );
        ig.system.canvas.addEventListener( 'touchmove', this.touchEvent.bind( this ), false );
        ig.system.canvas.addEventListener( 'touchend', this.touchEvent.bind( this ), false );
      }
    },

    // This is here for compatibility reasons. 
    // You can still use the normal ig.input.state('click') or ig.input.mouse.x if you only need a single touch
    // but remeber that this values could be the one of a random touch on your device

    keydown: function( e ) {
      this.parent( e );

      if ( e.type == 'mousedown' ) {
        this.touches.mouse = { x: this.mouse.x, y: this.mouse.y, id: 'mouse', state: 'down' };
      }
    },
    
    keyup: function( e ) {
      this.parent( e );
      
      if ( e.type == 'mouseup' ) {
        this.touches.mouse = this.touches.mouse || { id: 'mouse' };
        
        this.touches.mouse.state = 'up';
        this.touches.mouse.x = this.mouse.x;
        this.touches.mouse.y = this.mouse.y;
        
        this.delayedTouchUp.push( 'mouse' );
      }
    },
    
    mousemove: function( e ) {
      this.parent( e );
      
      if ( this.state( 'click' ) ) {
        this.touches.mouse.x = this.mouse.x;
        this.touches.mouse.y = this.mouse.y;
      }
    },
    
    clearPressed: function() {
      this.parent();
      
      for ( var i = ig.input.delayedTouchUp.length; i--; ) {
        delete ig.input.touches[ ig.input.delayedTouchUp[ i ] ];
      }
      
      ig.input.delayedTouchUp = [];
    },
    
    touchEvent: function( e ) {
      e.stopPropagation();
      e.preventDefault();

      for ( var i = e.changedTouches.length; i--; ) {
        var t = e.changedTouches[ i ];
        this[ 'multi' + e.type ](
          (t.clientX - ig.system.canvas.offsetLeft) / ig.system.scale, 
          (t.clientY - ig.system.canvas.offsetTop) / ig.system.scale,
          t.identifier
        );
      }
    },

    multiTouchStart: function( x, y, id ) {
      var action = this.bindings[ ig.KEY.MOUSE1 ];
      if ( action ) {
        this.actions[action] = true;
        this.presses[action] = true;
      }

      x /= ig.system.scale
      y /= ig.system.scale

      this.touches[ id ] = { x: x, y: y, id: id, state: 'down' };
    },

    multiTouchMove: function( x, y, id ) {
      if ( this.touches[ id ] ) {
        this.touches[ id ].x = x / ig.system.scale;
        this.touches[ id ].y = y / ig.system.scale;
      }
    },

    multiTouchEnd: function( x, y, id ) {
      if ( this.touches[ id ] ) {
        this.touches[ id ].state = 'up';
        this.delayedTouchUp.push( id );

        var action = this.bindings[ ig.KEY.MOUSE1 ];
        if ( action && this._isEmpty( this.touches ) ) {
          this.delayedKeyup[ action ] = true;
        }
      }
    },

    _isEmpty: function( obj ) {
      for ( var i in obj ) return false;
      return true;
    }

  });

});