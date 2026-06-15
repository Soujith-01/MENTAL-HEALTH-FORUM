import exp from 'express'
import { config } from 'dotenv'
import { verifyToken } from '../middlewares/verifyToken.js'
import { UserModel } from '../models/UserModel.js'
import PostModel from '../models/PostModel.js'
import NotificationModel from '../models/NotificationModel.js'

export const adminApp = exp.Router()
config()

const flattenReportedComments = (posts) => {
	const comments = []

	for (const post of posts) {
		for (const comment of post.comments || []) {
			if (comment.reports?.length) {
				comments.push({
					postId: post._id,
					postSnippet: post.content ? String(post.content).slice(0, 120) : '',
					comment,
				})
			}
		}
	}

	return comments
}

// List all users for admin review
adminApp.get('/users', verifyToken('ADMIN'), async (req, res) => {
		const users = await UserModel.find().select('-password')
		res.status(200).json({ users })
})

// Promote or demote a user role
adminApp.patch('/users/:userId/role', verifyToken('ADMIN'), async (req, res) => {
		const { role } = req.body
		if (!['USER', 'ADMIN'].includes(role)) {
			return res.status(400).json({ message: 'Invalid role' })
		}

		const user = await UserModel.findByIdAndUpdate(req.params.userId, { role }, { new: true }).select('-password')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ message: 'Role updated', user })
})

// Enable or disable a user account
adminApp.patch('/users/:userId/status', verifyToken('ADMIN'), async (req, res) => {
		const { isUserActive } = req.body
		const user = await UserModel.findByIdAndUpdate(
			req.params.userId,
			{ isUserActive: Boolean(isUserActive) },
			{ new: true }
		).select('-password')

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ message: 'User status updated', user })
})

// View reported posts
adminApp.get('/reports/posts', verifyToken('ADMIN'), async (req, res) => {
		const posts = await PostModel.find({ 'reports.0': { $exists: true } }).sort({ createdAt: -1 })
		res.status(200).json({ posts })
})

// View reported comments
adminApp.get('/reports/comments', verifyToken('ADMIN'), async (req, res) => {
		const posts = await PostModel.find({ 'comments.reports.0': { $exists: true } }).sort({ createdAt: -1 })
		res.status(200).json({ comments: flattenReportedComments(posts) })
})

// Send a system notification to all active users
adminApp.post('/notifications/system', verifyToken('ADMIN'), async (req, res) => {
		const { message } = req.body
		if (!message) {
			return res.status(400).json({ message: 'message is required' })
		}

		const users = await UserModel.find({ isUserActive: true }).select('_id')
		const notifications = users.map((user) => ({ recipient: user._id, type: 'system', message }))

		if (notifications.length) {
			await NotificationModel.insertMany(notifications)
		}

		res.status(201).json({ message: 'System notification sent', count: notifications.length })
})

// Report a user
adminApp.post('/report-user/:userId', verifyToken('USER', 'ADMIN'), async (req, res) => {
		const { reason } = req.body
		if (!reason || !['Spam', 'Harassment', 'Fake Information', 'Inappropriate Content', 'Other'].includes(reason)) {
			return res.status(400).json({ message: 'Valid reason is required' })
		}

		const targetUser = await UserModel.findById(req.params.userId)
		if (!targetUser) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Prevent self-reporting
		if (String(targetUser._id) === String(req.user.userId)) {
			return res.status(400).json({ message: 'Cannot report yourself' })
		}

		// Check if already reported by this user
		const alreadyReported = targetUser.reports?.some(report => String(report.reportedBy) === String(req.user.userId))
		if (alreadyReported) {
			return res.status(400).json({ message: 'You have already reported this user' })
		}

		targetUser.reports.push({ reportedBy: req.user.userId, reason })
		await targetUser.save()

		res.status(201).json({ message: 'User reported successfully' })
})

// Get all reported users
adminApp.get('/reported-users', verifyToken('ADMIN'), async (req, res) => {
		const users = await UserModel.find({ 'reports.0': { $exists: true } })
			.select('-password')
			.populate('reports.reportedBy', 'username')
			.sort({ createdAt: -1 })
		
		res.status(200).json({ users })
})

// Deactivate a user account
adminApp.patch('/users/:userId/deactivate', verifyToken('ADMIN'), async (req, res) => {
		const user = await UserModel.findByIdAndUpdate(
			req.params.userId,
			{ isUserActive: false },
			{ new: true }
		).select('-password')

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ message: 'User deactivated', user })
})

// Delete a comment
adminApp.delete('/comments/:commentId', verifyToken('ADMIN'), async (req, res) => {
		const posts = await PostModel.find({ 'comments._id': req.params.commentId })
		
		if (!posts.length) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		for (const post of posts) {
			post.comments = post.comments.filter(comment => String(comment._id) !== String(req.params.commentId))
			await post.save()
		}

		res.status(200).json({ message: 'Comment deleted successfully' })
})

// Get system statistics
adminApp.get('/statistics', verifyToken('ADMIN'), async (req, res) => {
		const totalUsers = await UserModel.countDocuments()
		const activeUsers = await UserModel.countDocuments({ isUserActive: true })
		const totalPosts = await PostModel.countDocuments()
		const totalReports = await UserModel.countDocuments({ 'reports.0': { $exists: true } })

		res.status(200).json({ 
			totalUsers,
			activeUsers,
			totalPosts,
			totalReports
		})
})
