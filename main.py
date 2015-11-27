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
import jinja2
import json
import logging
import mimetools
import os
import webapp2


from oauth2client import appengine


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates")),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)
CLIENT_SECRETS = os.path.join(os.path.dirname(__file__), 'client_secrets.json')
decorator = appengine.oauth2decorator_from_clientsecrets(
    CLIENT_SECRETS,
    scope='blocklyphoton')


class MainHandler(webapp2.RequestHandler):
    @decorator.oauth_required
    def get(self):
        http = decorator.http()
        resp, content = http.request("https://api.particle.io/v1/devices", "GET")
        devices = json.loads(content)
        logging.info(devices)

        template = JINJA_ENVIRONMENT.get_template('index.html')
        template_args = {
            'devices': devices,
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
    @decorator.oauth_aware
    def post(self):
        if not decorator.has_credentials():
            self.response.write("No valid OAuth credentials for Particle!")
            self.response.status = 400
            return
        if 'id' not in self.request.GET:
            self.response.write("Device ID not specified!")
            self.response.status = 400
            return

        logging.info(decorator.credentials.access_token)
        http = decorator.http()
        boundary, data = make_multipart({
            'file': {
                'type': 'text/plain', 
                'filename': 'sketch.ino',
                'data': self.request.body
            }
        })
        uri = "https://api.particle.io/v1/devices/%s" % (self.request.GET['id'],)
        logging.info(data)
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

app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/upload', UploadHandler),
    (decorator.callback_path, decorator.callback_handler()),
], debug=True)
