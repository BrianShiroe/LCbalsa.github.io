(function ($) {
  /**
   * Generate an indented list of links from a nav. Meant for use with panel().
   */
  $.fn.navList = function () {
    var $this = $(this),
      $a = $this.find("a"),
      b = [];

    $a.each(function () {
      var $link = $(this),
        indent = Math.max(0, $link.parents("li").length - 1),
        href = $link.attr("href"),
        target = $link.attr("target");

      b.push(
        '<a class="link depth-' +
          indent +
          '"' +
          (target ? ' target="' + target + '"' : "") +
          (href ? ' href="' + href + '"' : "") +
          '><span class="indent-' +
          indent +
          '"></span>' +
          $link.text() +
          "</a>"
      );
    });

    return b.join("");
  };

  /**
   * Panel-ify an element.
   */
  $.fn.panel = function (userConfig) {
    if (this.length === 0) return this;

    if (this.length > 1) {
      this.each(function () {
        $(this).panel(userConfig);
      });
      return this;
    }

    var $this = $(this),
      $body = $("body"),
      $window = $(window),
      id = $this.attr("id"),
      config = $.extend(
        {
          delay: 0,
          hideOnClick: false,
          hideOnEscape: false,
          hideOnSwipe: false,
          resetScroll: false,
          resetForms: false,
          side: null,
          target: $this,
          visibleClass: "visible",
        },
        userConfig
      );

    if (typeof config.target !== "jQuery") {
      config.target = $(config.target);
    }

    $this._hide = function (event) {
      if (!config.target.hasClass(config.visibleClass)) return;

      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      config.target.removeClass(config.visibleClass);

      setTimeout(function () {
        if (config.resetScroll) $this.scrollTop(0);
        if (config.resetForms) {
          $this.find("form").each(function () {
            this.reset();
          });
        }
      }, config.delay);
    };

    $this
      .css("-ms-overflow-style", "-ms-autohiding-scrollbar")
      .css("-webkit-overflow-scrolling", "touch");

    if (config.hideOnClick) {
      $this.find("a").css("-webkit-tap-highlight-color", "rgba(0,0,0,0)");

      $this.on("click", "a", function (event) {
        var $a = $(this),
          href = $a.attr("href"),
          target = $a.attr("target");

        if (!href || href === "#" || href === "" || href === "#" + id) return;

        event.preventDefault();
        event.stopPropagation();
        $this._hide();

        setTimeout(function () {
          if (target === "_blank") {
            window.open(href);
          } else {
            window.location.href = href;
          }
        }, config.delay + 10);
      });
    }

    $this.on("touchstart", function (event) {
      $this.touchPosX = event.originalEvent.touches[0].pageX;
      $this.touchPosY = event.originalEvent.touches[0].pageY;
    });

    $this.on("touchmove", function (event) {
      if ($this.touchPosX === null || $this.touchPosY === null) return;

      var diffX = $this.touchPosX - event.originalEvent.touches[0].pageX,
        diffY = $this.touchPosY - event.originalEvent.touches[0].pageY,
        th = $this.outerHeight(),
        ts = $this.get(0).scrollHeight - $this.scrollTop();

      if (config.hideOnSwipe) {
        var result = false,
          boundary = 20,
          delta = 50;

        switch (config.side) {
          case "left":
            result = Math.abs(diffY) < boundary && diffX > delta;
            break;
          case "right":
            result = Math.abs(diffY) < boundary && diffX < -delta;
            break;
          case "top":
            result = Math.abs(diffX) < boundary && diffY > delta;
            break;
          case "bottom":
            result = Math.abs(diffX) < boundary && diffY < -delta;
            break;
        }

        if (result) {
          $this.touchPosX = null;
          $this.touchPosY = null;
          $this._hide();
          return false;
        }
      }

      if (
        ($this.scrollTop() < 0 && diffY < 0) ||
        (ts > th - 2 && ts < th + 2 && diffY > 0)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    $this.on("click touchend touchstart touchmove", function (event) {
      event.stopPropagation();
    });

    $this.on("click", 'a[href="#' + id + '"]', function (event) {
      event.preventDefault();
      event.stopPropagation();
      config.target.removeClass(config.visibleClass);
    });

    $body.on("click touchend", function (event) {
      $this._hide(event);
    });

    $body.on("click", 'a[href="#' + id + '"]', function (event) {
      event.preventDefault();
      event.stopPropagation();
      config.target.toggleClass(config.visibleClass);
    });

    if (config.hideOnEscape) {
      $window.on("keydown", function (event) {
        if (event.keyCode === 27) $this._hide(event);
      });
    }

    return $this;
  };

  /**
   * Placeholder polyfill.
   */
  $.fn.placeholder = function () {
    if ("placeholder" in document.createElement("input")) return $(this);
    if (this.length === 0) return this;

    this.each(function () {
      var $form = $(this);

      $form
        .find("input[type=text],textarea")
        .each(function () {
          var i = $(this);
          if (i.val() === "" || i.val() === i.attr("placeholder")) {
            i.addClass("polyfill-placeholder").val(i.attr("placeholder"));
          }
        })
        .on("blur", function () {
          var i = $(this);
          if (!i.attr("name").match(/-polyfill-field$/) && i.val() === "") {
            i.addClass("polyfill-placeholder").val(i.attr("placeholder"));
          }
        })
        .on("focus", function () {
          var i = $(this);
          if (
            !i.attr("name").match(/-polyfill-field$/) &&
            i.val() === i.attr("placeholder")
          ) {
            i.removeClass("polyfill-placeholder").val("");
          }
        });

      $form.find("input[type=password]").each(function () {
        var i = $(this),
          x = $("<input>")
            .attr({
              type: "text",
              id: i.attr("id") + "-polyfill-field",
              name: i.attr("name") + "-polyfill-field",
              placeholder: i.attr("placeholder"),
            })
            .addClass("polyfill-placeholder")
            .val(i.attr("placeholder"))
            .insertAfter(i);

        if (i.val() === "") i.hide();
        else x.hide();

        i.on("blur", function (e) {
          e.preventDefault();
          if (i.val() === "") {
            i.hide();
            x.show();
          }
        });

        x.on("focus", function (e) {
          e.preventDefault();
          x.hide();
          i.show().focus();
        }).on("keypress", function (e) {
          e.preventDefault();
          x.val("");
        });
      });

      $form
        .on("submit", function () {
          $form.find("input,textarea").each(function () {
            var i = $(this);
            if (i.attr("name").match(/-polyfill-field$/)) i.attr("name", "");
            if (i.val() === i.attr("placeholder")) {
              i.removeClass("polyfill-placeholder").val("");
            }
          });
        })
        .on("reset", function (e) {
          e.preventDefault();

          $form.find("select").val(function () {
            return $("option:first", this).val();
          });

          $form.find("input,textarea").each(function () {
            var i = $(this),
              x;
            i.removeClass("polyfill-placeholder");

            switch (this.type) {
              case "submit":
              case "reset":
                break;
              case "password":
                i.val(i.attr("defaultValue"));
                x = i
                  .parent()
                  .find('input[name="' + i.attr("name") + '-polyfill-field"]');
                if (i.val() === "") {
                  i.hide();
                  x.show();
                } else {
                  i.show();
                  x.hide();
                }
                break;
              case "checkbox":
              case "radio":
                i.prop("checked", i.attr("defaultValue"));
                break;
              case "text":
              case "textarea":
                i.val(i.attr("defaultValue"));
                if (i.val() === "") {
                  i.addClass("polyfill-placeholder").val(i.attr("placeholder"));
                }
                break;
              default:
                i.val(i.attr("defaultValue"));
                break;
            }
          });
        });
    });

    return this;
  };

  /**
   * Move elements to/from first position of parent.
   */
  $.prioritize = function ($elements, condition) {
    var key = "__prioritize";

    if (typeof $elements !== "jQuery") {
      $elements = $($elements);
    }

    $elements.each(function () {
      var $e = $(this),
        $parent = $e.parent(),
        $p;

      if ($parent.length === 0) return;

      if (!$e.data(key)) {
        if (!condition) return;

        $p = $e.prev();
        if ($p.length === 0) return;

        $e.prependTo($parent);
        $e.data(key, $p);
      } else {
        if (condition) return;

        $p = $e.data(key);
        $e.insertAfter($p);
        $e.removeData(key);
      }
    });
  };
})(jQuery);
