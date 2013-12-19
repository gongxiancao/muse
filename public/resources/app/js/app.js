$(function (argument) {
    var status = {
            cardSeq: 0,
            handleSeq: 0,
            activeTool: 'none',
            dragStart: undefined
        },
        options = {
            cardIdPrefix: 'card-',
            cardContainerIdPrefix: 'card-container-',
            handleIdPrefix: 'handle-',
            color: '#00f'
        },
        toolCommands = {},
        $canvas = $('.canvas');

    $.fn.rotateY = function (amount) {
        amount = 'rotateY(' + amount + 'deg)';
        return this.each(function () {
            $(this).css('-webkit-transform', amount);
            $(this).css('transform', amount);
        });
    };

    $.fn.perspective = function (amount) {
        amount = amount + 'px';
        return this.each(function () {
            $(this).css('-webkit-perspective', amount);
            $(this).css('perspective', amount);
        });
    };

    $.fn.transform = function (transform, value) {
        return this.each(function () {
            if(transform) {
                transform = '-' + transform;
            }
            $(this).css('-webkit-transform' + transform, value);
            $(this).css('transform' + transform, value);
        });
    };


    function activateTool(tool) {
        deactiveTool(status.activeTool);
        status.activeTool = tool;
        toolActivated(tool);
    }

    function deactiveTool(tool) {
        toolDeactivated(tool);
    }

    function toolActivated(tool) {
        $('.tool-button[tool="' + tool + '"]').addClass('active-tool');
        toolCommands[tool].active();
    }

    function toolDeactivated(tool) {
        $('.tool-button[tool="' + tool + '"]').removeClass('active-tool');
        toolCommands[tool].deactive();
    }

    function putItHere(ele, evt) {
        ele.offset({left: evt.x, top: evt.y});
    }

    function shouldHandleEvent(evt) {
        return evt.button === 0;
    }

    function noop() {};

    function registerCommand (command) {
        command.panel = command.panel || 'left';
        command.activation = command.activation || 'active';
        toolCommands[command.name] = command;
        commandRegistered(command);

        if(command.activation === 'passive') {
            command.active();
        }
    }

    function commandRegistered (command) {
        if(!command.hide) {
            var content = command.label;
            if(command.background) {
                content = '<img src="' + command.background + '"/>';
            }
            $('.tool-panel' + '.' + command.panel).append('<div class="tool-button" tool="' + command.name + '">' + content + '</div>');
        }
    }

    function offsetoffset (offset, offsetX, offsetY) {
        offset.left += offsetX;
        offset.top += offsetY;
    }

    var maxLog = 30;
    var $log = $('.log');
    function log(obj) {
        $('.log').append('<div>' + JSON.stringify(obj) + '</div>');
        if($log.children().length >= maxLog) {
            $log.children().first().remove();
        }
    }

    function initColorPicker() {
        var color = options.color;
        $('#color-picker').css('background-color', color);
        $('#color-picker').ColorPicker({
            color: color,
            onShow: function (colpkr) {
                $(colpkr).fadeIn(500);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(500);
                return false;
            },
            onChange: function (hsb, hex, rgb) {
                options.color = '#' + hex;
                $('#color-picker').css('background-color', options.color);
            }
        });
    }

    initColorPicker();

    var eventTypeMap = {
        mousedown: 'down',
        mousemove: 'move',
        mouseup: 'up',
        touchstart: 'down',
        touchmove: 'move',
        touchend: 'up'
    };

    function adaptMouseEvent (evt) {
        var targetEventType = eventTypeMap[evt.type];
        evt.preventDefault();
        if(evt.which === 1) {
            if(targetEventType === 'down') {
                status.dragStart = {element: evt.srcElement};
            }

            $(evt.srcElement).trigger(targetEventType, {srcElement: status.dragStart.element, x: evt.clientX, y: evt.clientY});

            if(targetEventType === 'up') {
                delete status.dragStart;
            }
        }
    }

    function adaptTouchEvent (evt) {
        var targetEventType = eventTypeMap[evt.type];
        evt.preventDefault();

        if(evt.originalEvent.targetTouches) {
            for(var i = evt.originalEvent.targetTouches.length - 1; i >= 0; --i) {
                touch = evt.originalEvent.targetTouches[i];
                $(touch.target).trigger(targetEventType, {srcElement: touch.target, x: touch.clientX, y: touch.clientY});
            }
        }
    }

    function initEventAdapter() {
        $('body')
        .on('mousedown', adaptMouseEvent)
        .on('mousemove', adaptMouseEvent)
        .on('mouseup', adaptMouseEvent)
        .on('touchstart', adaptTouchEvent)
        .on('touchmove', adaptTouchEvent)
        .on('touchend', adaptTouchEvent);
    }

    initEventAdapter();

    registerCommand({
        name: 'none',
        label: 'none',
        active: noop,
        deactive: noop,
        hide: true
    });

    registerCommand({
        name: 'card-container',
        label: 'Container',
        panel: 'top',
        active: function () {
            $canvas.on('down', this.down);
        },
        deactive: function () {
            $canvas.off('down', this.down);
        },
        down: function (evt, data) {
            var cardContainerId = options.cardContainerIdPrefix + (++status.cardSeq),
                selector = '#' + cardContainerId;

            $canvas.append('<div class="card-container" id="' + cardContainerId + '" ></div>');

            putItHere($(selector), data);
        }
    });

    var cardCommandPrototype = {
        name: 'card',
        label: 'Card',
        panel: 'top',
        active: function () {
            $('.card-container', $canvas)
            .addClass('accept-card')
            .on('down', null, this, this.down);
        },
        deactive: function () {
            $('.card-container', $canvas)
            .removeClass('accept-card')
            .off('down', this.down);
        },
        down: function (evt, data) {
            var cardId = options.cardIdPrefix + (++status.cardSeq),
                selector = '#' + cardId;
                $cardContainer = $(data.srcElement).closest('.card-container');

            $cardContainer.append('<div class="card" id="' + cardId + '"></div>');
            $(selector).append('<img src="' + evt.data.background + '"/>');
        }
    };

    var cardCommand = Object.create(cardCommandPrototype);
    $.extend(cardCommand, {name: 'card1', label: 'Card1', background: '/resources/app/images/cover.png'});
    registerCommand(cardCommand);

    cardCommand = Object.create(cardCommandPrototype);
    $.extend(cardCommand, {name: 'card2', label: 'Card2', background: '/resources/app/images/content.png'});
    registerCommand(cardCommand);

    registerCommand({
        name: 'handle-resize',
        label: 'Resize',
        active: function () {
            $('.card-container', $canvas)
            .addClass('accept-handle')
            .on('down', this.down);
        },
        deactive: function () {
            $('.card-container', $canvas)
            .removeClass('accept-handle')
            .off('down', this.down);
        },
        down: function (evt, data) {
            var $card = $(data.srcElement).closest('.card-container'),
                $topLeftHandle,
                topLeftId,
                $bottomRightHandle,
                bottomRightId,
                cardOffset;

            function update () {
                var topLeftHandleOffset = $topLeftHandle.offset(),
                    bottomRightHandleOffset = $bottomRightHandle.offset(),
                    left, top, right, bottom;

                offsetoffset(topLeftHandleOffset, $topLeftHandle.width()/2, $topLeftHandle.height()/2);
                offsetoffset(bottomRightHandleOffset,  $bottomRightHandle.width()/2, $bottomRightHandle.height()/2);

                left    = topLeftHandleOffset.left < bottomRightHandleOffset.left? topLeftHandleOffset.left : bottomRightHandleOffset.left;
                right   = topLeftHandleOffset.left > bottomRightHandleOffset.left? topLeftHandleOffset.left : bottomRightHandleOffset.left;
                top     = topLeftHandleOffset.top < bottomRightHandleOffset.top? topLeftHandleOffset.top : bottomRightHandleOffset.top;
                bottom  = topLeftHandleOffset.top > bottomRightHandleOffset.top? topLeftHandleOffset.top : bottomRightHandleOffset.top;

                $card
                .offset({left: left, top: top})
                .width(right - left)
                .height(bottom - top);
            }

            if(!$card.hasClass('resize-handled')) {
                topLeftId = options.handleIdPrefix + (++ status.handleSeq);
                bottomRightId = options.handleIdPrefix + (++ status.handleSeq);

                $card.addClass('resize-handled');

                $canvas
                .append('<div class="resize handle top-left" id="' + topLeftId + '" card="' + $card.attr('id') + '"></div>')
                .append('<div class="resize handle bottom-right" id="' + bottomRightId + '" card="' + $card.attr('id') + '"></div>');

                cardOffset = $card.offset();

                $topLeftHandle = $('#' + topLeftId);
                $bottomRightHandle = $('#' + bottomRightId);

                $topLeftHandle.offset({left: cardOffset.left - ($topLeftHandle.width() / 2), top: cardOffset.top - ($topLeftHandle.height() / 2)});
                $bottomRightHandle.offset({left: cardOffset.left + $card.width() - ($bottomRightHandle.width() / 2), top: cardOffset.top + $card.height() - ($bottomRightHandle.height() / 2)});

                $canvas
                .on('handlemove', '#' + topLeftId, update)
                .on('handlemove', '#' + bottomRightId, update)
                .on('handleup', '#' + topLeftId, update)
                .on('handleup', '#' + bottomRightId, update);
            }
        }
    });

    registerCommand({
        name: 'handle-rotate',
        label: 'Rotate',
        active: function () {
            $('.card', $canvas)
            .addClass('accept-handle')
            .on('down', this.down);
        },
        deactive: function () {
            $('.card', $canvas)
            .removeClass('accept-handle')
            .off('down', this.down);
        },
        down: function (evt, data) {
            var $card = $(data.srcElement).closest('.card'),
                $handle,
                handleId,
                cardOffset,
                rotateStart;

            function update (evt, offset) {
                $card.attr('rotateY', offset.x * 1 + rotateStart);

                $card
                .rotateY(offset.x * 1 + rotateStart);
            }

            function rememberStart () {
                rotateStart = parseFloat($card.attr('rotateY'));
                if(isNaN(rotateStart)) {
                    rotateStart = 0;
                }
            }

            if(!$card.hasClass('rotate-handled')) {
                handleId = options.handleIdPrefix + (++ status.handleSeq);
                $card.addClass('rotate-handled');

                $canvas
                .append('<div class="rotate handle top-left" id="' + handleId + '" card="' + $card.attr('id') + '"></div>');

                cardOffset = $card.offset();

                $handle = $('#' + handleId);
                $card.closest('.card-container').perspective(2000);
                $card.transform('origin', 'left center');

                $handle.offset({left: cardOffset.left + $card.width() + $handle.width() / 2, top: cardOffset.top + (($card.height() - $handle.height()) / 2)});

                $canvas
                .on('handledown', '#' +  handleId, rememberStart)
                .on('handlemove', '#' + handleId, update)
                .on('handleup', '#' + handleId, update);
            }
        }
    });

    registerCommand({
        name: 'handle',
        label: 'Handle',
        activation: 'passive', // Active handle command automatically
        hide: true,
        active: function () {
            $canvas
            .on('down', '.handle', this.down)
            .on('move', this.move)
            .on('up', '.handle', this.up);
        },
        deactive: function () {
            $canvas
            .off('down', '.handle', this.down)
            .off('move', this.move)
            .off('up', '.handle', this.up);
        },
        down: function (evt, data) {
            var $element = $(data.srcElement).closest('.handle'),
                elementStartOffset = $element.offset();

            data.srcElement.dragStart = {deviceStart: {x: data.x, y: data.y}, element: $element, elementStart: elementStartOffset};
            data.srcElement.dragStart.element.trigger('handledown');
        },
        move: function (evt, data) {
            var offset,
                dragStart = data.srcElement.dragStart;
            if(dragStart) {
                offset = {x: data.x - dragStart.deviceStart.x, y: data.y - dragStart.deviceStart.y};
                dragStart.element.offset({left: dragStart.elementStart.left + offset.x, top: dragStart.elementStart.top + offset.y});
                dragStart.element.trigger('handlemove', offset);
            }
        },
        up: function (evt, data) {
            var offset,
                dragStart = data.srcElement.dragStart;

            if(dragStart) {
                offset = {x: data.x - dragStart.deviceStart.x, y: data.y - dragStart.deviceStart.y};
                dragStart.element.offset({left: dragStart.elementStart.left + offset.x, top: dragStart.elementStart.top + offset.y});
                dragStart.element.trigger('handleup', offset);
            }
            delete data.srcElement.dragStart;
        }
    });

    registerCommand({
        name: 'clear-log',
        label: 'Clear log',
        active: function () {
            $canvas
            .off('down move up');
            $('.log').empty();
        },
        deactive: noop
    });
    registerCommand({
        name: 'clear-all',
        label: 'Clear all',
        active: function () {
            $canvas
            .empty()
            .off('down move up');
            $('.log').empty();
        },
        deactive: noop
    });
    registerCommand({
        name: 'log',
        label: 'Log',
        active: function () {
            $log.parent().slideToggle();
        },
        deactive: noop
    });

    $('.tool-panel').on('down', '.tool-button', function (evt, data) {
        activateTool($(data.srcElement).closest('.tool-button').attr('tool'));
    });

});