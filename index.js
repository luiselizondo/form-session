var redis = require("redis");
var _ = require("lodash");
var util = require("util");
var events = require("events");

function Form(db, options) {
	this.db = db;
	this.client = redis.createClient(options.port, options.host, options);
	this.session = {};

	this.client.select(db, function(err, result) {
		if(err) console.log(err);
		if(result) console.log(result);
	});

	events.EventEmitter.call(this);
}

util.inherits(Form, events.EventEmitter);

Form.prototype.get = function get(userId, formid, next) {
	var self = this;

	self.client.hgetall(userId + " - " + formid, function(err, reply) {
		if(reply) self.session[formid] = reply;
		return next(err, reply);
	});
}

Form.prototype.set = function set(userId, formid, values, next) {
	var self = this;	
	self.client.hmset(userId + " - " + formid, values, function(err, res) {
		self.session[formid] = values;
		return next();
	});
}

Form.prototype.destroy = function destroy(userId, formid, next) {
	delete this.session[formid];
	this.client.del(userId + " - " + formid, function(err) {
		return next(err);
	});
}

Form.prototype.merge = function(userId, formid, values, next) {
	var self = this;
	this.get(userId, formid, function(err, result) {
		var session;
		if(result) {
			session = _.extend(values, result);
		}
		else {
			session = values;
		}

		self.set(userId, formid, session, function() {
			return next(false, session);
		});
	});
}

module.exports = Form;