#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import datetime
import httplib2
import jinja2
import json
import logging
import mimetools
import os
import webapp2

from oauth2client.client import flow_from_clientsecrets, AccessTokenCredentials
from webapp2_extras import securecookie


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates")),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
CLIENT_SECRETS = os.path.join(os.path.dirname(__file__), 'client_secrets.json')
flow = flow_from_clientsecrets(
    CLIENT_SECRETS,
    scope='blocklyphoton',
    redirect_uri="https://blocklyphoton.appspot.com/authorize")
cookiecrypt = securecookie.SecureCookieSerializer(flow.client_secret.decode('hex'))

DEFINITIONS = """
int ultrasonic_distance(int pin) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(5);
    digitalWrite(pin, HIGH);
    delayMicroseconds(5);
    digitalWrite(pin, LOW);
    pinMode(pin, INPUT);
    return pulseIn(pin, HIGH) / 29 / 2;
}
"""

def get_credentials(request):
    authcookie = None
    if 'auth' in request.cookies:
        authcookie = cookiecrypt.deserialize('auth', request.cookies['auth'])

    if not authcookie or 'auth' not in authcookie:
        return None

    credentials = AccessTokenCredentials(authcookie['auth'], 'blocklyphoton/1.0')
    return credentials


def set_csrf_cookie(fun):
    def decorate(self, *args, **kwargs):
        if 'state' not in self.request.cookies:
            self.csrf_token = os.urandom(16).encode('hex')
            self.response.set_cookie('state', self.csrf_token)
        else:
            self.csrf_token = self.request.cookies['state']
        return fun(self, *args, **kwargs)
    return decorate


def check_csrf_cookie(fun):
    def decorate(self, *args, **kwargs):
        if 'state' not in self.request.cookies or 'state' not in self.request.GET:
            self.response.write("No state token found")
            self.response.status = 400
            return
        elif self.request.cookies['state'] != self.request.GET['state']:
            self.response.write("Invalid state token")
            self.response.status = 400
        else:
            return fun(self, *args, **kwargs)
    return decorate

class MainHandler(webapp2.RequestHandler):
    @set_csrf_cookie
    def get(self):
        logging.info(repr(flow.client_secret))
        #credentials = get_credentials(self.request)
        #if not credentials:
        #    self.redirect(flow.step1_get_authorize_url().encode('utf-8'))
        #    return

        #http = credentials.authorize(httplib2.Http())
        #resp, content = http.request("https://api.particle.io/v1/devices", "GET")
        #devices = json.loads(content)
        devices = {}
        logging.info(devices)

        template = JINJA_ENVIRONMENT.get_template('index.html')
        template_args = {
            'devices': devices,
            'state': self.csrf_token,
        }
        self.response.write(template.render(template_args))


def make_multipart(parts):
    boundary = mimetools.choose_boundary()
    output = []
    for partname, part in parts.iteritems():
        output.append('--' + boundary)
        output.append('Content-Disposition: form-data; name="%s"; filename="%s"'
            % (partname, part['filename']))
        output.append('Content-Type: %s' % (part['type'],))
        output.append('')
        output.append(part['data'])
    output.append('--' + boundary + '--')
    output.append('')
    return (boundary, '\r\n'.join(output))


class UploadHandler(webapp2.RequestHandler):
    @check_csrf_cookie
    def post(self):
        credentials = get_credentials(self.request)
        if not credentials:
            self.response.write("No valid OAuth credentials for Particle!")
            self.response.status = 400
            return
        if 'id' not in self.request.GET:
            self.response.write("Device ID not specified!")
            self.response.status = 400
            return

        http = credentials.authorize(httplib2.Http())
        boundary, data = make_multipart({
            'file': {
                'type': 'text/plain', 
                'filename': 'sketch.ino',
                'data': DEFINITIONS + self.request.body
            }
        })
        uri = "https://api.particle.io/v1/devices/%s" % (self.request.GET['id'],)
        resp, content = http.request(
            uri,
            method="PUT",
            headers={"Content-Type": "multipart/form-data; boundary=%s" % (boundary,)},
            body=data)
        if resp.status != 200:
            self.response.write("Particle API returned status %s: %r" % (resp.status, content))
        else:
            reply = json.loads(content)
            logging.info(reply)
            if 'ok' not in reply or not reply['ok']:
                self.response.write(reply['error'])
                self.response.status = 400
            else:
                self.response.write("OK")


class OauthCallbackHandler(webapp2.RequestHandler):
    def get(self):
        credentials = flow.step2_exchange(self.request.GET)
        if not credentials:
            self.error(400)
            self.response.write("Got no credentials back!")

        self.response.set_cookie(
            "auth",
            cookiecrypt.serialize("auth", {
                "auth": credentials.access_token,
            }),
            expires=credentials.token_expiry)
        self.redirect("/")


app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/upload', UploadHandler),
    ('/oauth2callback', OauthCallbackHandler),
], debug=True)
