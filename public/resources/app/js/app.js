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

    function putItHere(ele, event) {
        ele.offset({left: event.x, top: event.y});
    }

    function shouldHandleEvent(event) {
        return event.button === 0;
    }

    function noop() {};

    function registerCommand (command) {
        toolCommands[command.name] = command;
        commandRegistered(command);
    }

    function commandRegistered (command) {
        if(!command.hide) {
            $('.tool-panel').append('<div class="tool-button" tool="' + command.name + '">' + command.label + '</div>');
        }
    }

    function offsetoffset (offset, offsetX, offsetY) {
        offset.left += offsetX;
        offset.top += offsetY;
    }

    function log(obj) {
        $('.log').append('<div>' + JSON.stringify(obj) + '</div>');
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

    function initEventAdapter() {
        $('body')
        .on('mousedown', function (event) {
            event.preventDefault();
            if(event.which) {
                $(event.srcElement).trigger('down', {srcElement: event.srcElement, x: event.clientX, y: event.clientY});
            }
        })
        .on('mousemove', function (event) {
            event.preventDefault();
            if(event.which) {
                $(event.srcElement).trigger('move', {srcElement: event.srcElement, x: event.clientX, y: event.clientY});
            }
        })
        .on('mouseup', function (event) {
            event.preventDefault();
            if(event.which) {
                $(event.srcElement).trigger('up', {srcElement: event.srcElement, x: event.clientX, y: event.clientY});
            }
        })
        .on('touchstart', function (event) {
            log(Object.keys(event));
            event.preventDefault();
        })
        .on('touchmove', function (event) {
            event.preventDefault();
        })
        .on('touchend', function(event) {
            log(Object.keys(event));
            event.preventDefault();
        });
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
        label: 'icon 0',
        active: function () {
            $canvas.on('down', this.down);
        },
        deactive: function () {
            $canvas.off('down', this.down);
        },
        down: function (event, data) {
            var cardContainerId = options.cardContainerIdPrefix + (++status.cardSeq),
                selector = '#' + cardContainerId;

            $canvas.append('<div class="card-container" id="' + cardContainerId + '" ></div>');

            putItHere($(selector), data);
        }
    });

    registerCommand({
        name: 'card',
        label: 'icon 1',
        active: function () {
            $('.card-container', $canvas)
            .addClass('accept-card')
            .on('down', this.down);
        },
        deactive: function () {
            $('.card-container', $canvas)
            .removeClass('accept-card')
            .off('down', this.down);
        },
        down: function (event, data) {
            var cardId = options.cardIdPrefix + (++status.cardSeq),
                selector = '#' + cardId;
                $cardContainer = $(data.srcElement).closest('.card-container');

            $cardContainer.append('<div class="card" id="' + cardId + '"></div>');
            $(selector).css('background-color', options.color);
        }
    });

    registerCommand({
        name: 'handle-resize',
        label: 'resize',
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
        down: function (event, data) {
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
        label: 'rotate',
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
        down: function (event, data) {
            var $card = $(data.srcElement).closest('.card'),
                $handle,
                handleId,
                cardOffset,
                rotateStart;

            function update (event, offset) {
                $card.attr('rotateY', offset.x * 0.25 + rotateStart);

                $card
                .rotateY(offset.x * 0.25 + rotateStart);
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
        label: 'handle',
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
        down: function (event, data) {
            var $element = $(data.srcElement).closest('.handle'),
                elementStartOffset = $element.offset();

            status.dragStart = {deviceStart: {x: data.x, y: data.y}, element: $element, elementStart: elementStartOffset};
            status.dragStart.element.trigger('handledown');
        },
        move: function (event, data) {
            var offset,
                dragStart = status.dragStart;

            if(dragStart) {
                offset = {x: data.x - dragStart.deviceStart.x, y: data.y - dragStart.deviceStart.y};
                dragStart.element.offset({left: dragStart.elementStart.left + offset.x, top: dragStart.elementStart.top + offset.y});
                dragStart.element.trigger('handlemove', offset);
            }
        },
        up: function (event, data) {
            var offset,
                dragStart = status.dragStart;

            if(dragStart) {
                offset = {x: data.x - dragStart.deviceStart.x, y: data.y - dragStart.deviceStart.y};
                dragStart.element.offset({left: dragStart.elementStart.left + offset.x, top: dragStart.elementStart.top + offset.y});
                dragStart.element.trigger('handleup', offset);
            }
            delete status.dragStart;
        }
    });

    registerCommand({
        name: 'clear-all',
        label: 'Clear all',
        active: function () {
            $canvas
            .empty()
            .off('mousedown mouseup mousemove touchstart touchmove touchend handledown handlemove handleup');
            $('.log').empty();
        },
        deactive: noop
    });


    $('.tool-panel').on('down', '.tool-button', function (event, data) {
        activateTool($(data.srcElement).attr('tool'));
    });

});