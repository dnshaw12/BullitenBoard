const express = require('express');
const router  = express.Router();
const Member  = require('../models/member');
const Event  = require('../models/event');
const Attendance  = require('../models/attendance');
const Request  = require('../models/request');
const bcrypt  = require('bcryptjs');

router.get('/create', async (req, res, next) => {

	if (req.session.logged) {
		try {

			const currentMember = await Member.findOne({_id: req.session.userId})

			console.log(currentMember);
			
			res.render('events/new.ejs', {
				member: currentMember,
				session: req.session
			})
		} catch(err){
		  next(err);
		}

	} else {
		req.session.message = 'Please log int before creating an event.'
		res.redirect('/')
	}

})

router.post('/', async (req, res, next) => {

	req.body.location = {}

	req.body.location.addr1 = req.body.addr1
	req.body.location.addr2 = req.body.addr2
	req.body.location.city = req.body.city
	req.body.location.state = req.body.state
	req.body.location.zip = req.body.zip
	req.body.requests = []

	console.log(req.body);

	try {
		const memberHost = await Member.findOne({ _id: req.body.host })


		if (memberHost) {
			console.log(memberHost,'memberHost');
			req.body.memberHost = req.body.host
		} // else {} if org

		if (req.body.hasAlcohol === 'on') {
			req.body.hasAlcohol = true
		} else {
			req.body.hasAlcohol = false
		}

		if (req.body.membersOnly === 'on') {
			req.body.membersOnly = true
		} else {
			req.body.membersOnly = false
		}

		if (req.body.attendeeMax) {
			req.body.attendeeMax = parseInt(req.body.attendeeMax)
		}

		console.log(req.body);

		const newEvent = await Event.create(req.body);

		const attendance = await Attendance.create({
		 	member: req.session.userId,
		 	event: newEvent._id
		})

		console.log(attendance);

		req.session.message = `${req.body.name} has been created!`

		console.log(newEvent);

		res.redirect('/')
		
	} catch(err){
	  next(err);
	}
})

router.get('/:id', async (req, res, next) => {
	
	try {
		const event = await Event.findById(req.params.id).populate('memberHost').populate('requests.member')

		console.log(event,'----------- event');

		const attendance = await Attendance.find({member: req.session.userId, event: req.params.id})

		const attendees = await Attendance.find({event: req.params.id}).populate('member');

		// console.log(event.requests.findIndex( r => r.member.toString() === req.session.userId), 'event reqs');
		// console.log(req.session.userId);

		// console.log(attendees);

		console.log(event.requests);

		res.render('events/show.ejs', {
			event: event,
			session: req.session,
			attendance: attendance,
			attendees: attendees
		})
		
	} catch(err){
	  next(err);
	}
})

router.post('/:id/attend', async (req, res, next) => {
	
	try {
		const attendance = await Attendance.create({
		 	member: req.session.userId,
		 	event: req.params.id
		})

		console.log(attendance);

		res.redirect('/events/' + req.params.id)

	} catch(err){
	  next(err);
	}


})

router.get('/:id/request', async (req, res, next) => {
	try {
		const event = await Event.findById(req.params.id);

		res.render('events/request.ejs', {
			event: event
		})


	} catch(err){
	  next(err);
	}
})

router.post('/:id/request', async (req, res, next) => {

	req.body.member = req.session.userId
	
	try {
		const event = await Event.findById(req.params.id)
		const newRequest = await Request.create(req.body)

		console.log(newRequest);

		event.requests.push(newRequest)

		await event.save()

		console.log(event.requests, 'event requests');

		res.redirect('/events/' + req.params.id)

	} catch(err){
	  next(err);
	}


})

router.delete('/:id/remove', async (req, res, next) => {
	console.log(req.body, 'delete reqbody');

	try {
		const removedAttendance = await Attendance.findOneAndDelete({member: req.body.memberId, event: req.params.id})

		console.log(removedAttendance);

		res.redirect('/events/'+req.params.id)


	} catch(err){
	  next(err);
	}

})

router.delete('/:id/reject', async (req, res, next) => {
	console.log('reject');
	try {
		const event = await Event.findById(req.params.id)


		console.log(event,"<----event");

		const rIndex = await event.requests.findIndex( r => {
			console.log(r.member.toString() === req.body.memberId);
			return r.member.toString() === req.body.memberId
		})
		console.log(rIndex);
		event.requests.splice(rIndex,1)

		event.save()

		res.redirect('/events/'+req.params.id)


	} catch(err){
	  next(err);
	}

})

router.post('/:id/accept', async (req, res, next) => {
	
	try {

		await Attendance.create({
			member: req.body.memberId,
			event: req.params.id
		})
		

		const event = await Event.findById(req.params.id)


		console.log(event,"<----event");

		const rIndex = await event.requests.findIndex( r => {
			console.log(r.member.toString() === req.body.memberId);
			return r.member.toString() === req.body.memberId
		})
		console.log(rIndex);
		event.requests.splice(rIndex,1)

		event.save()

		res.redirect('/events/'+req.params.id)

	} catch(err){
	  next(err);
	}


})





module.exports = router;