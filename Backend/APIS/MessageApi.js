import exp from 'express'
import { config } from 'dotenv'
import { verifyToken } from '../middlewares/verifyToken.js'
import { UserModel } from '../models/UserModel.js'
import NotificationModel from '../models/NotificationModel.js'
import { MessageModel } from '../models/MessageModel.js'
import { upload } from '../config/multer.js'
import { uploadToCloudinary } from '../config/cloudinaryUpload.js'

export const messageApp = exp.Router()
config()

const uploadAttachments = async (files = []) => {
	if (!files.length) {
		return []
	}

	const attachments = await Promise.all(
		files.map(async (file) => {
			const result = await uploadToCloudinary(file.buffer, file.originalname)
			return {
				url: result.secure_url || result.url || '',
				type: file.mimetype,
				name: file.originalname,
				public_id: result.public_id || '',
			}
		})
	)

	return attachments
}

const populateMessageUsers = [
	{ path: 'sender', select: 'username avatar email' },
	{ path: 'receiver', select: 'username avatar email' },
]

const getConversationPartnerId = (message, userId) => {
	const senderId = String(message?.sender?._id || message?.sender || '')
	const receiverId = String(message?.receiver?._id || message?.receiver || '')
	const currentUserId = String(userId)

	if (senderId === currentUserId) {
		return receiverId || null
	}

	if (receiverId === currentUserId) {
		return senderId || null
	}

	return null
}

// Search users by username for recipient selection
messageApp.get('/users/search', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const username = String(req.query.username || '').trim()

		if (!username) {
			return res.status(400).json({ message: 'username is required' })
		}

		const users = await UserModel.find({
			username: { $regex: username, $options: 'i' },
			isUserActive: true,
			_id: { $ne: req.user.userId },
		})
			.select('username avatar email role')
			.sort({ username: 1 })
			.limit(10)

		res.status(200).json({ users })
})

// List the current user's conversations
messageApp.get('/chats', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const messages = await MessageModel.find({
			$or: [{ sender: req.user.userId }, { receiver: req.user.userId }],
		})
			.populate(populateMessageUsers)
			.sort({ createdAt: -1 })

		const conversationMap = new Map()

		for (const message of messages) {
			const partnerId = getConversationPartnerId(message, req.user.userId)
			if (!partnerId) {
				continue
			}

			if (!conversationMap.has(partnerId)) {
				const partnerUser = String(message.sender?._id || message.sender) === String(req.user.userId)
					? message.receiver
					: message.sender

				conversationMap.set(partnerId, {
					user: partnerUser,
					lastMessage: message,
					count: 1,
				})
				continue
			}

			const existing = conversationMap.get(partnerId)
			existing.count += 1
		}

		res.status(200).json({
			chats: Array.from(conversationMap.values()).sort((left, right) => {
				const leftTime = new Date(left.lastMessage?.createdAt || 0).getTime()
				const rightTime = new Date(right.lastMessage?.createdAt || 0).getTime()
				return rightTime - leftTime
			}),
		})
})

// Send a new private message
messageApp.post('/messages', verifyToken('USER', 'ADMIN'), upload.array('attachments', 5), async (req, res, next) => {
		const { receiverId = null, content = '', parentMessage = null, channel = null } = req.body

		if (!receiverId && !channel) {
			return res.status(400).json({ message: 'receiverId or channel is required' })
		}

		const message = await MessageModel.create({
			sender: req.user.userId,
			receiver: receiverId,
			parentMessage,
			channel,
			content,
			attachments: await uploadAttachments(req.files || []),
		})

		if (receiverId && String(receiverId) !== String(req.user.userId)) {
			const sender = await UserModel.findById(req.user.userId).select('username')

			await NotificationModel.create({
				recipient: receiverId,
				sender: req.user.userId,
				type: 'message',
				message: sender?.username
					? `New message from ${sender.username}`
					: 'You have a new message',
			})
		}

		await message.populate(populateMessageUsers)

		res.status(201).json({ message: 'Message sent', data: message })
})

// List all messages for the current user
messageApp.get('/messages', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const messages = await MessageModel.find({
			$or: [{ sender: req.user.userId }, { receiver: req.user.userId }],
		}).sort({ createdAt: -1 })

		res.status(200).json({ messages })
})

// Load chat history with one user
messageApp.get('/messages/conversation/:userId', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const messages = await MessageModel.find({
			$or: [
				{ sender: req.user.userId, receiver: req.params.userId },
				{ sender: req.params.userId, receiver: req.user.userId },
			],
		})
			.populate(populateMessageUsers)
			.sort({ createdAt: 1 })

		res.status(200).json({ messages })
})

// Delete an entire direct-message chat with another user
messageApp.delete('/messages/conversation/:userId', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const result = await MessageModel.deleteMany({
			$or: [
				{ sender: req.user.userId, receiver: req.params.userId },
				{ sender: req.params.userId, receiver: req.user.userId },
			],
		})

		res.status(200).json({ message: 'Chat deleted', deletedCount: result.deletedCount || 0 })
})

// Load a message thread and its replies
messageApp.get('/messages/thread/:messageId', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const messages = await MessageModel.find({
			$or: [
				{ _id: req.params.messageId },
				{ parentMessage: req.params.messageId },
			],
		})
			.populate(populateMessageUsers)
			.sort({ createdAt: 1 })

		res.status(200).json({ messages })
})
