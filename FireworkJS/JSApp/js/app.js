﻿(function (app, window) {
    // Knockout context
    var appContext = {};

    window.onload = function () {
        // Check for page embeding
        setIFrameSource();

        // Init Fireworks
        window.Fireworks.init({ width: -400 });

        // Knockout
        applyKnockoutBindings();

        // Display initial text
        $(".present-title").writeText('Team "Daegon" presents:', function () {
            $(".present-text").writeText('... Fireworks JS !');
        });
    };

    app.generateScript = function () {
        var scriptContainer = $("#generateScript").find(".modal-body").first();
        var scriptTemplate = "(function (w) { var s = document.createElement('script'); s.src = 'https://rawgithub.com/JS2014TeamDaegon/FireworksJS/master/JSApp/js/fireworks-js/release/fireworks-js.min.js'; s.onload = function () { setTimeout(window.Fireworks.init(optionsPlaceHolder)); }; w.document.head.appendChild(s); })(window);";
        var options = "{";

        var defaultOptions = new window.Fireworks.Options();
        var currentOptions = window.Fireworks.options;

        for (var property in defaultOptions) {
            if (defaultOptions.hasOwnProperty(property)) {
                // Ignore dynamic options and ranges
                if (isPropertyForBinding(property)) {
                    var defaultValue = defaultOptions[property];
                    var currentValue = currentOptions[property];

                    if (defaultValue !== currentValue) {
                        if (isNaN(parseInt(currentValue))) {
                            currentValue = "'" + currentValue + "'";
                        }

                        options += property + ":" + currentValue + ",";
                    }
                }
                else if (isPropertyForRangeBinding(property)) {
                    var defaultValue = defaultOptions[property][1];
                    var currentValue = currentOptions[property][1];

                    if (defaultValue !== currentValue) {
                        options += property + ": [" + defaultOptions[property][0] + "," + currentValue + "],";
                    }
                }
            }
        }

        options += "}";

        // Set script in the container
        scriptContainer.html(scriptTemplate.replace("optionsPlaceHolder", options));
    };

    app.copyPresetToCustom = function () {
        var customPreset = appContext.presets()[appContext.presets().length - 1];
        var selectedPreset = appContext.selectedPreset();

        for (var property in appContext.options) {
            if (appContext.options.hasOwnProperty(property)) {
                appContext.options[property](selectedPreset.options[property]);
                customPreset.options[property] = selectedPreset.options[property];
            }
        }

        appContext.selectedPreset(customPreset);
    };

    app.load = function () {
        setIFrameSource($(".url-of-page").first().val());
    };

    function setIFrameSource(hash) {
        var iframe = window.document.getElementById("fireworks-target");

        // Load iframe
        var hash = hash || getUrlFromHash();
        if (hash) {
            if (hash.indexOf("http://") !== -1) {
                hash = hash.replace("http://", "");
            }

            iframe.src = "http://" + hash;
        }
        else {
            iframe.src = "about:blank";
        }
    }

    function getUrlFromHash() {
        return window.location.hash.substr(1);
    }

    function applyKnockoutBindings() {
        var options = window.Fireworks.options;
        var disablePresetChangeToCustom = false;

        // Options
        var observableOptions = {};
        // Map Current options to observables
        for (var property in options) {
            if (options.hasOwnProperty(property)) {
                // Ignore dynamic options and ranges
                if (isPropertyForBinding(property)) {
                    observableOptions[property] = ko.numericObservable(options[property]);
                    // On observable change
                    observableOptions[property].subscribe(function (propertyName, newValue) {
                        if (!disablePresetChangeToCustom) {
                            // Apply change to the custom preset
                            appContext.customPreset.options[propertyName] = newValue;

                            // Change the preset to Custom
                            if (appContext.selectedPreset().name !== "Custom") {
                                appContext.selectedPreset(appContext.customPreset);

                                observableOptions[propertyName](newValue);
                                options[propertyName] = newValue;
                                return;
                            }
                        }

                        // Update current option's value
                        options[propertyName] = newValue;
                    }.bind(null, property));
                }
                else if (isPropertyForRangeBinding(property)) {
                    observableOptions[property] = ko.numericObservable(options[property][1]);
                    // On observable change
                    observableOptions[property].subscribe(function (propertyName, newValue) {
                        if (!disablePresetChangeToCustom) {
                            // Apply change to the custom preset
                            appContext.customPreset.options[propertyName][1] = newValue;

                            // Change the preset to Custom
                            if (appContext.selectedPreset().name !== "Custom") {
                                appContext.selectedPreset(appContext.customPreset);

                                observableOptions[propertyName](newValue);
                                options[propertyName][1] = newValue;
                                return;
                            }
                        }

                        // Update current option's value
                        options[propertyName][1] = newValue;
                    }.bind(null, property));
                }
            }
        }
        appContext.options = observableOptions;

        // Predefined settings
        var presets = ko.observableArray(window.FireworkPresets);
        appContext.presets = presets;
        appContext.customPreset = appContext.presets()[appContext.presets().length - 1];

        // Choose current preset => Default
        appContext.selectedPreset = ko.observable(presets()[0]);
        // On current preset change
        appContext.selectedPreset.subscribe(function (newValue) {
            // Disable the auto change to Custom preset on option's value change
            disablePresetChangeToCustom = true;

            // Foreach observable option
            for (var property in observableOptions) {
                if (observableOptions.hasOwnProperty(property)) {
                    // Get the new option value
                    var value = newValue.options[property];

                    // Update the observable option
                    observableOptions[property](value);
                    // Update the fireworks option
                    window.Fireworks.options[property] = value;
                }
            }

            // Enable preset auto change
            disablePresetChangeToCustom = false;
        });

        ko.applyBindings(appContext, window.document.body);
    }

    function isPropertyForBinding(property) {
        return property !== "hue" &&
            property !== "hueStep" &&
            property.indexOf("Range") === -1 &&
            property !== "width" &&
            property !== "height";
    }

    function isPropertyForRangeBinding(property) {
        return property.indexOf("Range") !== -1;
    }
})(window.App = window.App || {}, window);