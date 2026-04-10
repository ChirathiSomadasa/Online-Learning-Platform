const Notification = require('../models/Notification')
const nodemailer = require('nodemailer')

const getTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })

// Helper to build HTML content based on notification type
const buildHTML = (data) => {
  if (data.type === 'welcome')
    return `<h2>Welcome!</h2><p>Hi ${data.userName}, welcome to the Online Learning Platform!</p>`

  if (data.type === 'enrollment_confirmation')
    return `<h2>Enrolled!</h2>
  <p>Hi ${data.userName},</p>
  <p>You are enrolled in <b>${data.courseTitle}</b> by ${data.instructor}.</p>
  <p>Enrollment ID: ${data.enrollmentId}</p>`

  if (data.type === 'new_course')
    return `<h2>New Course!</h2>
  <p><b>${data.courseTitle}</b> by ${data.instructor} is now available.</p>`

  if (data.type === 'payment_confirmation')
    return `<h2>Payment Confirmed</h2>
  <p>Hi ${data.userName},</p>
  <p>Your payment for <b>${data.courseTitle}</b> was successful.</p>
  <p>${data.message}</p>`

  return `<p>${data.message || 'Notification from Online Learning Platform'}</p>`
}

// POST /api/notifications/send — called by Student 1, 2, and 3
exports.sendNotification = async (req, res) => {
  const body = req.body || {}
  const log = await Notification.create({
    to: body.to,
    type: body.type,
    userName: body.userName,
    courseTitle: body.courseTitle,
    instructor: body.instructor,
    enrollmentId: body.enrollmentId,
    message: body.message,
    status: 'pending',
  })

  try {
    if (req.body.to && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const subjectByType = {
        welcome: 'Welcome to Online Learning Platform',
        enrollment_confirmation: `Enrolled: ${req.body.courseTitle}`,
        payment_confirmation: `Payment Confirmed: ${req.body.courseTitle} ${req.body.message}`,
      }
      const subject = subjectByType[req.body.type] || `New Course: ${req.body.courseTitle}`
      await getTransporter().sendMail({
        from: process.env.EMAIL_USER,
        to: req.body.to,
        subject,
        html: buildHTML(req.body),
      })
    }
    await Notification.findByIdAndUpdate(log._id, { status: 'sent' })
    res.json({ message: 'Notification sent', id: log._id })
  } catch (err) {
    await Notification.findByIdAndUpdate(log._id, { status: 'failed' })
    res.status(500).json({ message: 'Failed', error: err.message })
  }
}

// GET /api/notifications/logs — for admin to view all logs
exports.getLogs = async (req, res) => {
  try {
    const logs = await Notification.find().sort({ sentAt: -1 })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/notifications/logs/:email — for users to view their notification history
exports.getUserLogs = async (req, res) => {
  if (req.user.email !== req.params.email && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }
  try {
    const logs = await Notification.find({ to: req.user.email }).sort({
      sentAt: -1,
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
