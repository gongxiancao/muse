$(function (argument) {
    var status = {
            cardSeq: 0,
            handleSeq: 0,
            activeTool: 'none',
            dragStart: undefined
        },
        options = {
            cardIdPrefix: 'card-',
            handleIdPrefix: 'handle-'
        },
        toolCommands = {},
        $canvas = $('.canvas');

    function activateTool(tool) {
        deactiveTool(status.activeTool);
        status.activeTool = tool;
        toolActivated(tool);
    }

    function deactiveTool(tool) {
        toolDeactivated(tool);
    }

    function toolActivated(tool) {
        $(event.srcElement).addClass('active-tool');
        toolCommands[tool].active();
    }

    function toolDeactivated(tool) {
        $('.tool-button[tool="' + tool + '"]').removeClass('active-tool');
        toolCommands[tool].deactive();
    }

    function putItHere(ele, event) {
        ele.offset({top:event.clientY, left:event.clientX});
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

    registerCommand({
        name: 'none',
        label: 'none',
        active: noop,
        deactive: noop,
        hide: true
    });

    registerCommand({
        name: 'card',
        label: 'icon 1',
        active: function () {
            $canvas.on('mousedown', this.mousedown);
        },
        deactive: function () {
            $canvas.off('mousedown', this.mousedown);
        },
        mousedown: function (event) {
            var cardId = options.cardIdPrefix + (++status.cardSeq),
                selector = '#' + cardId;

            $canvas.append('<div class="card" id="' + cardId + '"></div>');

            putItHere($(selector), event);
        }
    });

    registerCommand({
        name: 'handle-zoom',
        label: 'zoom',
        active: function () {
            $('.card', $canvas)
            .addClass('accept-handle')
            .on('mousedown', this.mousedown);
        },
        deactive: function () {
            $('.card', $canvas)
            .removeClass('accept-handle')
            .off('mousedown', this.mousedown);
        },
        mousedown: function (event) {
            var $card = $(event.srcElement).closest('.card'),
                $topLeftHandle,
                topLeftId,
                $bottomRightHandle,
                bottomRightId,
                cardOffset;

            if(!$card.hasClass('zoom-handled')) {
                topLeftId = options.handleIdPrefix + (++ status.handleSeq);
                bottomRightId = options.handleIdPrefix + (++ status.handleSeq);

                $card.addClass('zoom-handled');

                $canvas
                .append('<div class="zoom handle top-left" id="' + topLeftId + '" card="' + $card.attr('id') + '"></div>')
                .append('<div class="zoom handle bottom-right" id="' + bottomRightId + '" card="' + $card.attr('id') + '"></div>');

                cardOffset = $card.offset();

                $topLeftHandle = $('#' + topLeftId);
                $bottomRightHandle = $('#' + bottomRightId);

                $topLeftHandle.offset({left: cardOffset.left - ($topLeftHandle.width() / 2), top: cardOffset.top - ($topLeftHandle.height() / 2)});
                $bottomRightHandle.offset({left: cardOffset.left + $card.width() - ($bottomRightHandle.width() / 2), top: cardOffset.top + $card.height() - ($bottomRightHandle.height() / 2)});

                function update (argument) {
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
            $('.card', $canvas).addClass('accept-handle');
        },
        deactive: function () {
            $('.card', $canvas).removeClass('accept-handle');
        },
        mousedown: function () {
            
        }
    });

    registerCommand({
        name: 'handle',
        label: 'handle',
        active: function () {
            $canvas
            .on('mousedown', '.handle', this.mousedown)
            .on('mousemove', this.mousemove)
            .on('mouseup', '.handle', this.mouseup);
        },
        deactive: function () {
            $canvas
            .off('mousedown', '.handle', this.mousedown)
            .off('mousemove', this.mousemove)
            .off('mouseup', '.handle', this.mouseup);
        },
        mousedown: function (event) {
            var $element = $(event.srcElement).closest('.handle'),
                elementStartOffset = $element.offset();

            status.dragStart = {deviceStart: {x: event.clientX, y: event.clientY}, element: $element, elementStart: elementStartOffset};
            status.dragStart.element.trigger('handledown');
        },
        mousemove: function (event) {
            var offset,
                dragStart = status.dragStart;

            if(dragStart && event.which) {
                offset = {};
                offset.x = event.clientX - dragStart.deviceStart.x;
                offset.y = event.clientY - dragStart.deviceStart.y;
                dragStart.element.offset({left: dragStart.elementStart.left + offset.x, top: dragStart.elementStart.top + offset.y});
                dragStart.element.trigger('handlemove', offset);
            }
        },
        mouseup: function (event) {
            var offset,
                dragStart = status.dragStart;

            if(dragStart && event.which) {
                offset = {};
                offset.x = event.clientX - dragStart.deviceStart.x;
                offset.y = event.clientY - dragStart.deviceStart.y;
                dragStart.element.offset({left: dragStart.elementStart.left + offset.x, top: dragStart.elementStart.top + offset.y});
                dragStart.element.trigger('handleup', offset);
            }
            status.dragStart = undefined;
        }
    });

    $('.tool-panel').on('mousedown', '.tool-button', function (event) {
        activateTool($(event.srcElement).attr('tool'));
    });

    $canvas.on('mousedown', function (event) {

    });

    $canvas.on('mouseup', function (event) {
    });

});