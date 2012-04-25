define(['jquery', 'underscore', 'backbone' ], function ($, _, Backbone) {

    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    Date.prototype.toPrettyString = function () {
        return dayNames[this.getDay()] + " " +
            this.getDate() + " " +
            monthNames[this.getMonth()] + " " +
            this.getFullYear() + " at " +
            this.getHours().toZeroPaddedString(2) + ":" +
            this.getMinutes().toZeroPaddedString(2);
    };

    Date.prototype.toPrettyStringWithoutTime = function () {
        return dayNames[this.getDay()] + " " +
            this.getDate() + " " +
            monthNames[this.getMonth()] + " " +
            this.getFullYear();
    };

    Date.prototype.toYMD = function () {
        return this.getFullYear() + '-' + (this.getMonth() + 1).toZeroPaddedString(2) + '-' + this.getDate().toZeroPaddedString(2)
    };

    Date.prototype.toCalendarDate = function () {
        return { 'day':this.getDate(), 'month':this.getMonth(), 'year':this.getFullYear()}
    };

    Date.prototype.withoutTimeOfDay = function () {
        return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0, 0);
    };

    Date.prototype.asArray = function () {
        return [this.getFullYear(), this.getMonth(), this.getDate()]
    };


    Date.prototype.toTimeOfDay = function () {
        return { 'hours':this.getHours(), 'minutes':this.getMinutes(),
            'seconds':this.getSeconds(), 'milliseconds':this.getMilliseconds()};
    }

    Date.prototype.diff = function (other) {
        return parseInt((this.withoutTimeOfDay().getTime() - other.withoutTimeOfDay().getTime()) / (1000.0 * 60 * 60 * 24))
    }

    Number.prototype.toZeroPaddedString = function (digits) {
        val = this + "";
        while (val.length < digits) val = "0" + val;
        return val;
    }

    function renderTemplate(template, data) {
        return _.template(template.html(), (data == undefined) ? {} : data);
    }

    function applyTemplate(target, template, data) {
        return target.empty().append(renderTemplate(template, data))
    }

    function replaceWithTemplate(target, template, data) {
        return target.replaceWith(renderTemplate(template, data))
    }

    var TicketMonster = new Object();

    TicketMonster.Event = Backbone.Model.extend({
        urlRoot:'rest/events'
    })

    TicketMonster.Events = Backbone.Collection.extend({
        url:"rest/events",
        model:TicketMonster.Event,
        id:"id",
        comparator:function (model) {
            return model.get('category').id;
        }
    });

    TicketMonster.Venue = Backbone.Model.extend({
        urlRoot:'rest/venues'
    })

    TicketMonster.Venues = Backbone.Collection.extend({
        url:"rest/venues",
        model:TicketMonster.Venue,
        id:"id",
        comparator:function (model) {
            return model.get('address').city;
        }
    });

    TicketMonster.EventsCategoriesView = Backbone.View.extend({
        render:function () {
            applyTemplate($(this.el), $('#main-view'), {})
            var summaryView = new TicketMonster.EventSummaryView({model:this.model});
            $("#itemSummary").append(summaryView.render().el)
            this.menuView = new TicketMonster.EventMenuView({summaryView:summaryView, model:this.model, el:$("#itemMenu")});
            this.menuView.render()
        }
    })

    TicketMonster.VenueCitiesView = Backbone.View.extend({
        render:function () {
            applyTemplate($(this.el), $('#main-view'), {})
            var venueSummaryView = new TicketMonster.VenueSummaryView({model:this.model});
            $("#itemSummary").append(venueSummaryView.render().el)
            this.menuView = new TicketMonster.VenueMenuView({summaryView:venueSummaryView, model:this.model, el:$("#itemMenu")});
            this.menuView.render()
        }
    })


    TicketMonster.EventMenuView = Backbone.View.extend({
        events:{
            "click a":"update"
        },
        tagName:'div',
        render:function () {
            var self = this
            $(this.el).empty()
            var current_category = null
            _.each(this.model.models, function (event) {
                var model_category = event.get('category')
                if (current_category !== model_category.id) {
                    $(self.el).append(renderTemplate($('#category-title'), model_category));
                    current_category = model_category.id;
                }
                var view = new TicketMonster.EventSummaryLineView({summaryView:self.options.summaryView, model:event});
                $("#category-" + current_category).append(view.render().el);
            })
            $(".collapse").collapse()
            $("a[rel='popover']").popover({trigger:'hover'})
            return this
        },
        update:function () {
            $("a[rel='popover']").popover('hide')
        }
    });

    TicketMonster.VenueMenuView = Backbone.View.extend({
        events:{
            "click a":"update"
        },
        tagName:'div',
        render:function () {
            var self = this
            $(this.el).empty()
            var current_city = null
            _.each(this.model.models, function (event) {
                var model_city = event.get('address').city
                if (current_city !== model_city) {
                    $(self.el).append(renderTemplate($('#city'), event.get('address')));
                    current_city = model_city;
                }
                var view = new TicketMonster.VenueSummaryLineView({summaryView:self.options.summaryView, model:event});
                $("#city-" + current_city).append(view.render().el);
            })
            $(".collapse").collapse()
            return this
        },
        update:function () {
            $("a[rel='popover']").popover('hide')
        }
    });

    TicketMonster.VenueSummaryLineView = Backbone.View.extend({
        tagName:'div',
        events:{
            "click":"notify"
        },
        render:function () {
            applyTemplate($(this.el), $("#venue-summary"), this.model.attributes)
            return this;
        },
        notify:function () {
            this.options.summaryView.render(this.model)
        }
    })

    TicketMonster.EventSummaryView = Backbone.View.extend({
        render:function (data) {
            if (data) {
                applyTemplate($(this.el), $("#event-summary-view"), data.attributes)
            }
            else {
                applyTemplate($(this.el), $("#event-carousel"), {models:this.model.models});
                $(this.el).find('.item:first').addClass('active')
            }
            return this
        }
    })

    TicketMonster.VenueSummaryView = Backbone.View.extend({
        render:function (data) {
            if (data) {
                applyTemplate($(this.el), $("#venue-summary-view"), data.attributes)
            }
            else {
                applyTemplate($(this.el), $("#venue-carousel"), {models:this.model.models});
                $(this.el).find('.item:first').addClass('active')
            }
            return this
        }
    })

    TicketMonster.EventSummaryLineView = Backbone.View.extend({
        tagName:'div',
        events:{
            "click":"notify"
        },
        render:function () {
            applyTemplate($(this.el), $("#event-summary"), this.model.attributes)
            return this;
        },
        notify:function () {
            this.options.summaryView.render(this.model)
        }
    })

    TicketMonster.EventDetailView = Backbone.View.extend({
        events:{
            "click input[name='bookButton']":"beginBooking",
            "change select[id='venueSelector']":"refreshShows",
            "change select[id='dayPicker']":"refreshTimes"
        },
        render:function () {
            $(this.el).empty()
            applyTemplate($(this.el), $("#event-detail"), this.model.attributes)
            $("#bookingOption").hide()
            $("#venueSelector").attr('disabled', true)
            $("#dayPicker").empty()
            $("#dayPicker").attr('disabled', true)
            $("#performanceTimes").empty()
            $("#performanceTimes").attr('disabled', true)
            var self = this
            $.getJSON("rest/shows?event=" + this.model.get('id'), function (shows) {
                self.shows = shows
                $("#venueSelector").empty().append("<option value='0'>Select a venue</option>");
                $.each(shows, function (i, show) {
                    $("#venueSelector").append("<option value='" + show.id + "'>" + show.venue.address.city + " : " + show.venue.name + "</option>")
                })
                $("#venueSelector").removeAttr('disabled')
                if ($("#venueSelector").val()) {
                    $("#venueSelector").change()
                }
            })
        },
        beginBooking:function () {
            tmRouter.navigate('/book/' + $("#venueSelector option:selected").val() + '/' + $("#performanceTimes").val(), true)
        },
        refreshShows:function (event) {
            $("#dayPicker").empty()

            var selectedShowId = event.currentTarget.value;

            if (selectedShowId != 0) {
                var selectedShow = _.find(this.shows, function (show) {
                    return show.id == selectedShowId
                });
                this.selectedShow = selectedShow;
                applyTemplate($("#eventVenueDescription"), $("#event-venue-description"), {venue:selectedShow.venue});
                var times = _.uniq(_.sortBy(_.map(selectedShow.performances, function (performance) {
                    return (new Date(performance.date).withoutTimeOfDay()).getTime()
                }), function (item) {
                    return item
                }));
                applyTemplate($("#venueMedia"), $("#venue-media"), selectedShow.venue)
                $("#dayPicker").removeAttr('disabled')
                $("#performanceTimes").removeAttr('disabled')
                _.each(times, function (time) {
                    var date = new Date(time)
                    $("#dayPicker").append("<option value='" + date.toYMD() + "'>" + date.toPrettyStringWithoutTime() + "</option>")
                })
                this.refreshTimes()
                $("#bookingWhen").show(100)
            } else {
                $("#bookingWhen").hide(100)
                $("#bookingOption").hide()
                $("#dayPicker").empty()
                $("#venueMedia").empty()
                $("#eventVenueDescription").empty()
                $("#dayPicker").attr('disabled', true)
                $("#performanceTimes").empty()
                $("#performanceTimes").attr('disabled', true)
            }

        },
        refreshTimes:function () {
            var selectedDate = $("#dayPicker").val();
            $("#performanceTimes").empty()
            if (selectedDate) {
                $.each(this.selectedShow.performances, function (i, performance) {
                    var performanceDate = new Date(performance.date);
                    if (_.isEqual(performanceDate.toYMD(), selectedDate)) {
                        $("#performanceTimes").append("<option value='" + performance.id + "'>" + performanceDate.getHours().toZeroPaddedString(2) + ":" + performanceDate.getMinutes().toZeroPaddedString(2) + "</option>")
                    }
                })
            }
            $("#bookingOption").show()
        }

    });

    TicketMonster.VenueDetailView = Backbone.View.extend({
        events:{
            "click input[name='bookButton']":"beginBooking",
            "change select[id='eventSelector']":"refreshShows",
            "change select[id='dayPicker']":"refreshTimes"
        },
        render:function () {
            $(this.el).empty()
            applyTemplate($(this.el), $("#venue-detail"), this.model.attributes)
            $("#eventSelector").attr('disabled', true)
            $("#bookingOption").hide()
            $("#dayPicker").empty()
            $("#dayPicker").attr('disabled', true)
            $("#performanceTimes").empty()
            $("#performanceTimes").attr('disabled', true)
            var self = this
            $.getJSON("rest/shows?venue=" + this.model.get('id'), function (shows) {
                self.shows = shows
                $("#eventSelector").empty().append("<option value='0'>Select an event</option>");
                $.each(shows, function (i, show) {
                    $("#eventSelector").append("<option value='" + show.id + "'>" + show.event.name + "</option>")
                })
                $("#eventSelector").removeAttr('disabled')
                if ($("#eventSelector").val()) {
                    $("#eventSelector").change()
                }
            })
        },
        beginBooking:function () {
            tmRouter.navigate('/book/' + $("#eventSelector option:selected").val() + '/' + $("#performanceTimes").val(), true)
        },
        refreshShows:function (event) {
            $("#dayPicker").empty()
            var selectedShowId = event.currentTarget.value;
            if (selectedShowId != 0) {
                var selectedShow = _.find(this.shows, function (show) {
                    return show.id == selectedShowId
                });
                this.selectedShow = selectedShow;
                applyTemplate($("#venueEventDescription"), $("#venue-event-description"), {event:selectedShow.event});
                var times = _.uniq(_.sortBy(_.map(selectedShow.performances, function (performance) {
                    return (new Date(performance.date).withoutTimeOfDay()).getTime()
                }), function (item) {
                    return item
                }));
                applyTemplate($("#eventMedia"), $("#venue-media"), selectedShow.event)
                $("#dayPicker").removeAttr('disabled')
                $("#performanceTimes").removeAttr('disabled')
                _.each(times, function (time) {
                    var date = new Date(time)
                    $("#dayPicker").append("<option value='" + date.toYMD() + "'>" + date.toPrettyStringWithoutTime() + "</option>")
                })
                $("#bookingWhen").show(100)
                this.refreshTimes()
            } else {
                $("#bookingWhen").hide(100)
                $("#bookingOption").hide()
                $("#dayPicker").empty()
                $("#eventMedia").empty()
                $("#venueEventDescription").empty()
                $("#dayPicker").attr('disabled', true)
                $("#performanceTimes").empty()
                $("#performanceTimes").attr('disabled', true)
            }

        },
        refreshTimes:function () {
            var selectedDate = $("#dayPicker").val();
            $("#performanceTimes").empty()
            if (selectedDate) {
                $.each(this.selectedShow.performances, function (i, performance) {
                    var performanceDate = new Date(performance.date);
                    if (_.isEqual(performanceDate.toYMD(), selectedDate)) {
                        $("#performanceTimes").append("<option value='" + performance.id + "'>" + performanceDate.getHours().toZeroPaddedString(2) + ":" + performanceDate.getMinutes().toZeroPaddedString(2) + "</option>")
                    }
                })
            }
            $("#bookingOption").show()
        }

    })


    TicketMonster.Booking = Backbone.Model.extend({
        urlRoot:'rest/bookings'
    })

    TicketMonster.Bookings = Backbone.Collection.extend({
        url:'rest/bookings',
        model:TicketMonster.Booking,
        id:'id'
    })

    TicketMonster.BookingRowView = Backbone.View.extend({
        tagName:'tr',
        events:{
            "click i[data-tm-role='delete']":"delete",
            "click a":"showDetails"
        },
        render:function () {
            applyTemplate($(this.el), $("#booking-row"), this.model.attributes)
            return this;
        },
        delete:function (event) {
            if (confirm("Are you sure you want to delete booking " + this.model.get('id'))) {
                this.model.destroy({wait:true})
            }
            event.stopPropagation()
            event.stopImmediatePropagation()
        },
        showDetails:function () {
            tmRouter.navigate("#bookings/" + this.model.get('id'), true)
        }
    })

    TicketMonster.TicketSummaryLineView = Backbone.View.extend({
        tagName:'tr',
        events:{
            "click i":"removeEntry"
        },
        render:function () {
            applyTemplate($(this.el), $('#ticket-request-summary'), {ticketRequest:this.model.ticketRequest})
            return this
        },
        removeEntry:function () {
            this.model.tickets.splice(this.model.index, 1)
        }
    })

    TicketMonster.TicketSummaryView = Backbone.View.extend({
        render:function () {
            var self = this
            applyTemplate($(this.el), $('#ticket-summary-view'), this.model.bookingRequest)
            _.each(this.model.bookingRequest.tickets, function (ticketRequest, index, tickets) {
                $('#ticketRequestSummary')
                    .append(new TicketMonster.TicketSummaryLineView({model:{ticketRequest:ticketRequest, index:index, tickets:tickets, parentView:self}}).render().el);
            });
        }
    })

    TicketMonster.BookingsView = Backbone.View.extend({
        render:function () {
            applyTemplate($(this.el), $('#booking-table'), {})
            _.each(this.model.models, function (booking) {
                var bookingView = new TicketMonster.BookingRowView({model:booking})
                $("#bookingList").append(bookingView.render().el)
            })
        }
    })

    TicketMonster.BookingRequest = Backbone.Model.extend({

    });

    TicketMonster.AllocationRequest = Backbone.Model.extend({

    });

    TicketMonster.SectionSelectorView = Backbone.View.extend({
        render:function () {
            var self = this;
            applyTemplate($(this.el), $("#select-section"), { sections:_.uniq(_.sortBy(_.pluck(self.model.priceCategories, 'section'), function (item) {
                return item.id
            }), true, function (item) {
                return item.id
            })})
            return this
        }
    });

    TicketMonster.TicketCategoryView = Backbone.View.extend({
        events:{
            "change input":"onChange"
        },
        render:function () {
            applyTemplate($(this.el), $('#ticket-entry'), this.model.attributes);
            return this;
        },
        onChange:function (event) {
            var value = event.currentTarget.value;
            if ($.isNumeric(value) && value > 0) {
                this.model.set('quantity', parseInt(value))
            }
            else {
                this.model.unset('quantity')
            }
        }
    });


    TicketMonster.TicketCategoriesView = Backbone.View.extend({

        id:'categoriesView',
        render:function () {
            var views = {};

            if (this.model != null) {
                var priceCategories = _.map(this.model.models, function (item) {
                    return item.attributes.priceCategory
                })
                applyTemplate($(this.el), $('#ticket-entries'), {priceCategories:priceCategories});

                _.each(this.model.models, function (model) {
                    $("#ticket-category-input-" + model.attributes.priceCategory.id).append(new TicketMonster.TicketCategoryView({model:model}).render().el);

                });
            } else {
                $(this.el).empty()
            }
            return this;
        },
        updateModel:function () {

        }
    });

    TicketMonster.PriceCategoryQuantity = Backbone.Model.extend({

        initialize:function () {
            this.bind("change", this.onChange)
        },
        onChange:function () {
            if (!this.hasChanged('quantity'))
                return;
        }
    });

    TicketMonster.SectionQuantities = Backbone.Collection.extend({
        initialize:function () {
            this.on("change", function () {
                var sectionAggregate = _.reduce(this.models, function (aggregate, model) {
                    if (model.get('quantity') != null) {
                        return {tickets:(aggregate.tickets + model.get('quantity')),
                            price:(aggregate.price + model.get('priceCategory').price * model.get('quantity'))}
                    }
                    return aggregate;
                }, {tickets:0, price:0});
            })

        }
    });

    TicketMonster.CreateBookingView = Backbone.View.extend({
        events:{
            "click input[name='submit']":"save",
            "change select":"refreshPrices",
            "keyup #email":"updateEmail",
            "click input[name='add']":"addQuantities",
            "click i":"updateQuantities"
        },
        render:function () {

            var self = this;
            $.getJSON("rest/shows/" + this.model.showId, function (selectedShow) {

                self.currentPerformance = _.find(selectedShow.performances, function (item) {
                    return item.id == self.model.performanceId
                });
                applyTemplate($(self.el), $("#create-booking"), { show:selectedShow,
                    performance:self.currentPerformance});
                self.selectorView = new TicketMonster.SectionSelectorView({model:selectedShow, el:$("#sectionSelectorPlaceholder")}).render();
                self.ticketCategoriesView = new TicketMonster.TicketCategoriesView({model:{}, el:$("#ticketCategoriesViewPlaceholder") });
                self.ticketSummaryView = new TicketMonster.TicketSummaryView({model:self.model, el:$("#ticketSummaryView")});
                self.show = selectedShow;
                self.ticketCategoriesView.render();
                self.ticketSummaryView.render();
                $("#sectionSelector").change();
            });
        },
        refreshPrices:function (event) {
            var priceCategories = _.filter(this.show.priceCategories, function (item) {
                return item.section.id == event.currentTarget.value
            })
            var models = new Array()
            _.each(priceCategories, function (priceCategory) {
                var model = new TicketMonster.PriceCategoryQuantity()
                model.set('priceCategory', priceCategory)
                models.push(model)
            })
            this.ticketCategoriesView.model = new TicketMonster.SectionQuantities(models);
            this.ticketCategoriesView.render();
        },
        save:function (event) {
            var bookingRequest = {ticketRequests:[]};
            var self = this;
            bookingRequest.ticketRequests = _.map(this.model.bookingRequest.tickets, function (ticket) {
                return {priceCategory:ticket.priceCategory.id, quantity:ticket.quantity}
            });
            bookingRequest.email = this.model.bookingRequest.email;
            bookingRequest.performance = this.model.performanceId
            $.ajax({url:"rest/bookings",
                data:JSON.stringify(bookingRequest),
                type:"POST",
                dataType:"json",
                contentType:"application/json",
                success:function (booking) {
                    this.model = {}
                    $.getJSON('rest/shows/performance/' + booking.performance.id, function (retrievedPerformance) {
                        applyTemplate($(self.el), $("#booking-confirmation"), {booking:booking, performance:retrievedPerformance })
                    });
                }}).error(function (error) {
                    if (error.status == 400 || error.status == 409) {
                        var errors = $.parseJSON(error.responseText).errors;
                        _.each(errors, function (errorMessage) {
                            $("#request-summary").append('<div class="alert alert-error"><a class="close" data-dismiss="alert">×</a><strong>Error!</strong> ' + errorMessage + '</div>')
                        });
                    } else {
                        $("#request-summary").append('<div class="alert alert-error"><a class="close" data-dismiss="alert">×</a><strong>Error! </strong>An error has occured</div>')
                    }

                })

        },
        addQuantities:function () {
            var self = this;

            _.each(this.ticketCategoriesView.model.models, function (model) {
                if (model.attributes.quantity != undefined) {
                    var found = false
                    _.each(self.model.bookingRequest.tickets, function (ticket) {
                        if (ticket.priceCategory.id == model.attributes.priceCategory.id) {
                            ticket.quantity += model.attributes.quantity
                            found = true;
                        }
                    });
                    if (!found) {
                        self.model.bookingRequest.tickets.push({priceCategory:model.attributes.priceCategory, quantity:model.attributes.quantity})
                    }
                }
            });
            this.ticketCategoriesView.model = null
            $('option:selected', 'select').removeAttr('selected')
            this.ticketCategoriesView.render()
            this.selectorView.render();
            this.updateQuantities();
        },
        updateQuantities:function () {
            // make sure that tickets are sorted by section and ticket category
            this.model.bookingRequest.tickets.sort(function (t1, t2) {
                if (t1.priceCategory.section.id != t2.priceCategory.section.id) {
                    return t1.priceCategory.section.id - t2.priceCategory.section.id;
                }
                else {
                    return t1.priceCategory.ticketCategory.id - t2.priceCategory.ticketCategory.id
                }
            });

            this.model.bookingRequest.totals = _.reduce(this.model.bookingRequest.tickets, function (totals, ticketRequest) {
                return {
                    tickets:totals.tickets + ticketRequest.quantity,
                    price:totals.price + ticketRequest.quantity * ticketRequest.priceCategory.price
                };
            }, {tickets:0, price:0.0});

            this.ticketSummaryView.render();
            this.setCheckoutStatus()
        },
        updateEmail:function (event) {
            if ($(event.currentTarget).is(':valid')) {
                this.model.bookingRequest.email = event.currentTarget.value

            } else {
                delete this.model.bookingRequest.email
            }
            this.setCheckoutStatus()
        },
        setCheckoutStatus:function () {
            if (this.model.bookingRequest.totals != undefined && this.model.bookingRequest.totals.tickets > 0 && this.model.bookingRequest.email != undefined && this.model.bookingRequest.email != '') {
                $('input[name="submit"]').removeAttr('disabled')
            }
            else {
                $('input[name="submit"]').attr('disabled', true)
            }
        }
    });

    TicketMonster.BookingDetailView = Backbone.View.extend({
        render:function () {
            var self = this
            $.getJSON('rest/shows/performance/' + this.model.attributes.performance.id, function (retrievedPerformance) {
                applyTemplate($(self.el), $("#booking-details"), {booking:self.model.attributes, performance:retrievedPerformance})
            });
            return this
        }
    })

    TicketMonster.AboutView = Backbone.View.extend({
        render:function () {
            $(this.el).empty().append("<section><h1>Welcome to Ticket Monster!</h1>" +
                "Ticket Monster is a demo application</section>")
        }
    });

    TicketMonster.Router = Backbone.Router.extend({
        routes:{
            "":"events",
            "events":"events",
            "events/:id":"eventDetail",
            "venues":"venues",
            "venues/:id":"venueDetail",
            "about":"about",
            "book/:showId/:performanceId":"bookTickets",
            "bookings":"listBookings",
            "bookings/:id":"bookingDetail",
            "ignore":"ignore",
            "*actions":"defaultHandler"
        },
        events:function () {
            var events = new TicketMonster.Events;
            var eventsView = new TicketMonster.EventsCategoriesView({model:events, el:$("#content")})
            events.bind("reset",
                function () {
                    eventsView.render()
                }).fetch()
        },
        venues:function () {
            var venues = new TicketMonster.Venues;
            var venuesView = new TicketMonster.VenueCitiesView({model:venues, el:$("#content")})
            venues.bind("reset",
                function () {
                    venuesView.render()
                }).fetch()
        },
        about:function () {
            new TicketMonster.AboutView({el:$("#content")}).render()
        },
        bookTickets:function (showId, performanceId) {
            var createBookingView = new TicketMonster.CreateBookingView({model:{showId:showId, performanceId:performanceId, bookingRequest:{tickets:[]}}, el:$("#content")})
            createBookingView.render()
        },
        listBookings:function () {
            var bookings = new TicketMonster.Bookings()
            var bookingsView = new TicketMonster.BookingsView({model:bookings, el:$("#content")})

            bookings.bind("destroy",
                function () {
                    bookings.fetch({success:function () {
                        bookingsView.render()
                    }})
                });

            bookings.fetch({success:function () {
                bookingsView.render()
            }});
        },
        eventDetail:function (id) {
            var model = new TicketMonster.Event({id:id});
            var eventDetailView = new TicketMonster.EventDetailView({model:model, el:$("#content")});
            model.bind("change",
                function () {
                    eventDetailView.render()
                }).fetch()
        },
        venueDetail:function (id) {
            var model = new TicketMonster.Venue({id:id});
            var venueDetailView = new TicketMonster.VenueDetailView({model:model, el:$("#content")});
            model.bind("change",
                function () {
                    venueDetailView.render()
                }).fetch()
        },
        bookingDetail:function (id) {
            var bookingModel = new TicketMonster.Booking({id:id});
            var bookingDetailView = new TicketMonster.BookingDetailView({model:bookingModel, el:$("#content")})
            bookingModel.bind("change",
                function () {
                    bookingDetailView.render()
                }).fetch()

        }
    });

    var tmRouter = new TicketMonster.Router;

    Backbone.history.start();

});





