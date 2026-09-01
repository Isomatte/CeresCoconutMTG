/**
 * Widerrufsformular des Themes.
 *
 * Sendet die Widerrufserklaerung an den eigenen Endpunkt
 * /rest/cerescoconutmtg/cancellation, damit der Reply-To-Header der Mail an den Shop
 * auf die Kontakt-E-Mail des Kunden zeigt. Das Ceres-Widget "E-Mail-Formular" postet
 * beim Formulartyp "Formular zum Vertragswiderruf" stattdessen auf
 * /rest/io/cancellation - dieser Core-Endpunkt ignoriert die uebergebene Antwortadresse.
 *
 * Die Bindung laeuft ueber Event-Delegation auf document, weil Vue beim Mounten das
 * server-gerenderte Markup neu aufbaut und direkt gesetzte Listener verlieren wuerde.
 */
(function () {
    "use strict";

    var ENDPOINT = "/rest/cerescoconutmtg/cancellation";
    var REQUIRED_FIELDS = ["name", "order", "email"];
    var ALL_FIELDS = ["name", "address", "order", "email", "orderedAt", "receivedAt", "reason", "username"];
    // Muss zu CancellationFormController::isMailAddress() passen.
    var MAIL_PATTERN = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

    // Zeitpunkt des Seitenaufbaus. Der Server verlangt einen Mindestabstand zum
    // Absenden und lehnt zu schnelle Einsendungen ab.
    var loadedAt = Date.now();

    var DEFAULT_MESSAGES = {
        required: "Bitte füllen Sie alle Pflichtfelder aus.",
        email: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
        failed: "Ihr Widerruf konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.",
        toofast: "Bitte senden Sie das Formular noch einmal ab.",
        success: "Wir haben Ihren Widerruf erhalten.",
        successcopy: "Eine Bestätigung ist an Ihre E-Mail-Adresse unterwegs."
    };

    function message(form, key) {
        return form.getAttribute("data-msg-" + key) || DEFAULT_MESSAGES[key];
    }

    function endpointUrl() {
        return (window.App && window.App.urlTrailingSlash) ? ENDPOINT + "/" : ENDPOINT;
    }

    function field(form, name) {
        return form.querySelector('[name="' + name + '"]');
    }

    function value(form, name) {
        var input = field(form, name);
        return input ? input.value.trim() : "";
    }

    function markField(form, name, hasError) {
        var input = field(form, name);
        if (!input) {
            return;
        }

        var unit = input.closest(".input-unit");
        if (unit) {
            if (hasError) {
                unit.classList.add("error");
            } else {
                unit.classList.remove("error");
            }
        }
    }

    function clearMarks(form) {
        ALL_FIELDS.forEach(function (name) {
            markField(form, name, false);
        });
    }

    function showError(form, text) {
        var box = form.querySelector("[data-mtg-cancellation-error]");
        if (!box) {
            return;
        }

        box.textContent = text;
        box.classList.remove("d-none");
        box.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function hideError(form) {
        var box = form.querySelector("[data-mtg-cancellation-error]");
        if (box) {
            box.classList.add("d-none");
        }
    }

    function setBusy(form, busy) {
        var button = form.querySelector("[data-mtg-cancellation-submit]");
        if (button) {
            button.disabled = busy;
        }

        Array.prototype.forEach.call(form.querySelectorAll("input, textarea"), function (input) {
            input.disabled = busy;
        });
    }

    function showSuccess(form, receivedAt) {
        var wrapper = form.parentNode;
        var box = wrapper ? wrapper.querySelector("[data-mtg-cancellation-success]") : null;
        var text = message(form, "success");

        if (receivedAt) {
            text += " (" + receivedAt + ")";
        }

        if (form.getAttribute("data-customer-copy") === "1") {
            text += " " + message(form, "successcopy");
        }

        if (box) {
            var target = box.querySelector("[data-mtg-cancellation-success-text]") || box;
            target.textContent = text;
            box.classList.remove("d-none");
            box.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        form.classList.add("d-none");
    }

    /**
     * @returns {string|null} Schluessel der Fehlermeldung oder null, wenn alles passt.
     */
    function validate(form) {
        clearMarks(form);

        var invalid = REQUIRED_FIELDS.filter(function (name) {
            return !value(form, name).length;
        });

        invalid.forEach(function (name) {
            markField(form, name, true);
        });

        if (invalid.length) {
            focusFirst(form, invalid[0]);
            return "required";
        }

        if (!MAIL_PATTERN.test(value(form, "email"))) {
            markField(form, "email", true);
            focusFirst(form, "email");
            return "email";
        }

        return null;
    }

    function focusFirst(form, name) {
        var input = field(form, name);
        if (input) {
            input.focus();
        }
    }

    function buildBody(form) {
        var body = new URLSearchParams();

        ALL_FIELDS.forEach(function (name) {
            body.append(name, value(form, name));
        });

        body.append("elapsed", String(Date.now() - loadedAt));

        return body.toString();
    }

    function requestHeaders() {
        var headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json"
        };

        // Ceres liest den CSRF-Token aus demselben Feld. Auf Seiten ohne Session
        // existiert es nicht, dann wird auch keiner erwartet.
        var tokenField = document.getElementById("csrf-token");
        if (tokenField && tokenField.value) {
            headers["X-CSRF-TOKEN"] = tokenField.value;
        }

        return headers;
    }

    function submit(form) {
        hideError(form);

        var messageKey = validate(form);
        if (messageKey) {
            showError(form, message(form, messageKey));
            return;
        }

        // Body vor dem Deaktivieren der Felder bauen.
        var body = buildBody(form);
        setBusy(form, true);

        fetch(endpointUrl(), {
            method: "POST",
            credentials: "same-origin",
            headers: requestHeaders(),
            body: body
        }).then(function (response) {
            return response.json().catch(function () {
                return { success: response.ok };
            });
        }).then(function (result) {
            if (result && result.success) {
                showSuccess(form, result.receivedAt);
                return;
            }

            setBusy(form, false);

            if (result && result.error === "validation" && Array.isArray(result.fields)) {
                result.fields.forEach(function (name) {
                    markField(form, name, true);
                });
                showError(form, message(form, "required"));
                return;
            }

            showError(form, message(form, result && result.error === "tooFast" ? "toofast" : "failed"));
        }).catch(function () {
            setBusy(form, false);
            showError(form, message(form, "failed"));
        });
    }

    document.addEventListener("submit", function (event) {
        var form = event.target;

        if (!form || !form.hasAttribute || !form.hasAttribute("data-mtg-cancellation-form")) {
            return;
        }

        event.preventDefault();
        submit(form);
    });

    // Fehlermarkierung entfernen, sobald der Kunde das Feld korrigiert.
    document.addEventListener("input", function (event) {
        var input = event.target;

        if (!input || !input.closest) {
            return;
        }

        var form = input.closest("[data-mtg-cancellation-form]");
        if (!form) {
            return;
        }

        var unit = input.closest(".input-unit");
        if (unit) {
            unit.classList.remove("error");
        }
    });
})();
