(function (fetch, Promise, d3) {

  var getNotifications = function() {
    var checkStatus = function(response) {
      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        var error = new Error(response.statusText);
        error.response = response;
        throw error;
      }
    };

    return new Promise(function(resolve, reject) {
      fetch('https://gdc-api.nci.nih.gov/notifications')
      .then(checkStatus)
      .then(function(response) {
        return response.json();
      }).then(function(json) {
        resolve(json.data);
      });
    });
  };

  var readDismissedCookie = function() {
    var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)gdc-dismissed-notifications\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    var dismissedIds = JSON.parse(cookieValue || '[]');
    return dismissedIds;
  };

  var addDismissedIdToCookie = function(notificationID) {
    var dismissedIds = readDismissedCookie();
    if (dismissedIds.indexOf(notificationID) === -1) {
      dismissedIds = dismissedIds.concat(notificationID);
      var cookieString = 'gdc-dismissed-notifications='
        .concat(JSON.stringify(dismissedIds))
        .concat(';path=/');
      document.cookie=cookieString;
    }
  };

  var renderNotifications = function(notifications) {
    var container = d3.select('#notifications');

    var bannerHTML = '<span class="fa-stack"> \
        <i class="fa fa-circle-o fa-stack-2x"></i>\
        <i class="fa inner-icon"></i> \
      </span>\
      <span class="header-message"> \
      </span> \
      <span class="header-banner-dismiss"> \
          Dismiss <span class="fa fa-close" aria-hidden="true"></span>\
      </span>';

    notifications.forEach(function(n) {
      var banner = container.append('div')
      .classed('header-banner', true)
      .classed('enter', true)
      .html(bannerHTML);
      setTimeout(function() { banner.classed('enter', false), 1});
      banner.classed('warning', n.level === 'WARNING')
            .classed('error', n.level === 'ERROR');

      banner.select('.fa-circle-o')
      .classed('hidden', n.level === 'ERROR');

      banner.select('.inner-icon')
      .classed('fa-question', n.level === 'INFO')
      .classed('fa-exclamation', n.level === 'WARNING')
      .classed('fa-stack-1x', n.level === 'INFO' || n.level === 'WARNING')
      .classed('fa-exclamation-triangle', n.level === 'ERROR')
      .classed('fa-2x', n.level === 'ERROR');

      banner.select('.header-message')
            .text(n.message);

      banner.select('.header-banner-dismiss')
            .classed('hidden', !n.dismissible)
            .on('click', function() {
              banner.classed('dismissed', n.dismissible);
              addDismissedIdToCookie(n.id);
            });

    });

  }

  getNotifications().then(function(data) {
    var alreadyDismissedIds = readDismissedCookie();
    var docNotifications = data
      .filter(function(d) { return (d.components || []).indexOf('DOCUMENTATION') !== -1; })
      .filter(function(d) { return alreadyDismissedIds.indexOf(d.id) === -1; } );

    if (docNotifications.length) {
      renderNotifications(docNotifications);
    }
  });

})(window.fetch, window.Promise, d3);
