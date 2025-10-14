/**
 * PixelFlow Browser Tracking Script
 *
 * This script is embedded on merchant websites to track user events
 * and send them to the PixelFlow API for processing.
 *
 * Features:
 * - Automatic page view tracking
 * - Custom event tracking
 * - Offline support with localStorage queue
 * - Retry failed events
 * - Cookie management for user identification
 * - Cross-browser compatible (IE11+)
 */

(function() {
  'use strict';

  // Configuration
  var config = {
    apiUrl: window.PIXELFLOW_API_URL || 'https://pixelflow.app/api/track',
    merchantId: window.PIXELFLOW_MERCHANT_ID || '',
    debug: window.PIXELFLOW_DEBUG || false,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  // Validate configuration
  if (!config.merchantId) {
    console.error('PixelFlow: PIXELFLOW_MERCHANT_ID is required');
    return;
  }

  // Utility functions
  var utils = {
    /**
     * Generate UUID v4
     */
    generateUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    /**
     * Get or create user ID cookie
     */
    getUserId: function() {
      var cookieName = '_pf_uid';
      var cookies = document.cookie.split(';');

      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName + '=') === 0) {
          return cookie.substring(cookieName.length + 1);
        }
      }

      // Create new user ID
      var userId = utils.generateUUID();
      var expires = new Date();
      expires.setFullYear(expires.getFullYear() + 2); // 2 years

      document.cookie = cookieName + '=' + userId +
                       ';expires=' + expires.toUTCString() +
                       ';path=/;SameSite=Lax';

      return userId;
    },

    /**
     * Get Facebook browser pixel (_fbp)
     */
    getFBP: function() {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf('_fbp=') === 0) {
          return cookie.substring(5);
        }
      }
      return null;
    },

    /**
     * Get Facebook click ID (_fbc)
     */
    getFBC: function() {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf('_fbc=') === 0) {
          return cookie.substring(5);
        }
      }

      // Check URL for fbclid parameter
      var urlParams = new URLSearchParams(window.location.search);
      var fbclid = urlParams.get('fbclid');

      if (fbclid) {
        var fbc = 'fb.1.' + Date.now() + '.' + fbclid;
        document.cookie = '_fbc=' + fbc + ';path=/;max-age=7776000;SameSite=Lax';
        return fbc;
      }

      return null;
    },

    /**
     * Log debug messages
     */
    log: function() {
      if (config.debug) {
        console.log.apply(console, ['[PixelFlow]'].concat(Array.prototype.slice.call(arguments)));
      }
    },

    /**
     * Log errors
     */
    error: function() {
      console.error.apply(console, ['[PixelFlow]'].concat(Array.prototype.slice.call(arguments)));
    },
  };

  // Queue for offline events
  var eventQueue = {
    key: '_pf_queue',

    /**
     * Get queued events from localStorage
     */
    get: function() {
      try {
        var queue = localStorage.getItem(this.key);
        return queue ? JSON.parse(queue) : [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Add event to queue
     */
    add: function(event) {
      try {
        var queue = this.get();
        queue.push({
          event: event,
          timestamp: Date.now(),
          attempts: 0,
        });
        localStorage.setItem(this.key, JSON.stringify(queue));
      } catch (e) {
        utils.error('Failed to queue event:', e);
      }
    },

    /**
     * Remove event from queue
     */
    remove: function(index) {
      try {
        var queue = this.get();
        queue.splice(index, 1);
        localStorage.setItem(this.key, JSON.stringify(queue));
      } catch (e) {
        utils.error('Failed to remove event from queue:', e);
      }
    },

    /**
     * Process queued events
     */
    process: function() {
      var queue = this.get();

      for (var i = queue.length - 1; i >= 0; i--) {
        var item = queue[i];

        // Skip if too many attempts
        if (item.attempts >= config.retryAttempts) {
          this.remove(i);
          continue;
        }

        // Increment attempts
        item.attempts++;

        // Try to send
        pixelFlow.sendEvent(item.event, true);
      }
    },
  };

  // Main PixelFlow object
  var pixelFlow = {
    /**
     * Initialize the pixel
     */
    init: function() {
      utils.log('Initializing PixelFlow');

      // Track page view automatically
      this.trackPageView();

      // Process any queued events
      eventQueue.process();

      // Set up retry interval
      setInterval(function() {
        eventQueue.process();
      }, 30000); // Every 30 seconds
    },

    /**
     * Track a page view
     */
    trackPageView: function() {
      this.track('PageView', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      });
    },

    /**
     * Track a custom event
     */
    track: function(eventName, eventData) {
      eventData = eventData || {};

      var event = {
        eventName: eventName,
        merchantId: config.merchantId,
        eventSource: 'browser',
        eventSourceUrl: window.location.href,
        userId: utils.getUserId(),
        userAgent: navigator.userAgent,
        fbp: utils.getFBP(),
        fbc: utils.getFBC(),
        timestamp: Date.now(),
      };

      // Merge custom event data
      for (var key in eventData) {
        if (eventData.hasOwnProperty(key)) {
          event[key] = eventData[key];
        }
      }

      this.sendEvent(event, false);
    },

    /**
     * Send event to API
     */
    sendEvent: function(event, isRetry) {
      utils.log('Sending event:', event.eventName);

      var payload = JSON.stringify(event);

      // Try sendBeacon first (most reliable)
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        var sent = navigator.sendBeacon(config.apiUrl, blob);

        if (sent) {
          utils.log('Event sent via sendBeacon');

          // Remove from queue if retry
          if (isRetry) {
            var queue = eventQueue.get();
            for (var i = 0; i < queue.length; i++) {
              if (queue[i].event.timestamp === event.timestamp) {
                eventQueue.remove(i);
                break;
              }
            }
          }
          return;
        }
      }

      // Fallback to fetch
      if (window.fetch) {
        fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Merchant-ID': config.merchantId,
          },
          body: payload,
          keepalive: true,
        })
        .then(function(response) {
          if (response.ok) {
            utils.log('Event sent via fetch');

            // Remove from queue if retry
            if (isRetry) {
              var queue = eventQueue.get();
              for (var i = 0; i < queue.length; i++) {
                if (queue[i].event.timestamp === event.timestamp) {
                  eventQueue.remove(i);
                  break;
                }
              }
            }
          } else {
            throw new Error('HTTP ' + response.status);
          }
        })
        .catch(function(error) {
          utils.error('Failed to send event:', error);

          // Queue for retry if not already queued
          if (!isRetry) {
            eventQueue.add(event);
          }
        });

        return;
      }

      // Fallback to XMLHttpRequest
      var xhr = new XMLHttpRequest();
      xhr.open('POST', config.apiUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Merchant-ID', config.merchantId);

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          utils.log('Event sent via XHR');

          // Remove from queue if retry
          if (isRetry) {
            var queue = eventQueue.get();
            for (var i = 0; i < queue.length; i++) {
              if (queue[i].event.timestamp === event.timestamp) {
                eventQueue.remove(i);
                break;
              }
            }
          }
        } else {
          utils.error('Failed to send event: HTTP ' + xhr.status);

          // Queue for retry
          if (!isRetry) {
            eventQueue.add(event);
          }
        }
      };

      xhr.onerror = function() {
        utils.error('Failed to send event: Network error');

        // Queue for retry
        if (!isRetry) {
          eventQueue.add(event);
        }
      };

      xhr.send(payload);
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      pixelFlow.init();
    });
  } else {
    pixelFlow.init();
  }

  // Expose global API
  window.pixelFlow = pixelFlow;

  utils.log('PixelFlow loaded successfully');
})();
