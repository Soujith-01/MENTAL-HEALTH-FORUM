import exp from 'express'
import { config } from 'dotenv'
import { verifyToken } from '../middlewares/verifyToken.js'
import { UserModel } from '../models/UserModel.js'
import PostModel from '../models/PostModel.js'
import NotificationModel from '../models/NotificationModel.js'
import { upload } from '../config/multer.js'
import { uploadToCloudinary } from '../config/cloudinaryUpload.js'

export const userApp = exp.Router()
config()

const categories = [
	'Anxiety',
	'Depression',
	'Student Life',
	'Relationships',
	'Career Stress',
	'Self Improvement',
]

const reactionTypes = ['like', 'helpful', 'support']

const parseBoolean = (value, defaultValue = false) => {
	if (value === undefined || value === null || value === '') {
		return defaultValue
	}

	if (typeof value === 'boolean') {
		return value
	}

	return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase())
}

const parseTags = (value) => {
	if (Array.isArray(value)) {
		return value.map((tag) => String(tag).trim()).filter(Boolean)
	}

	if (typeof value === 'string') {
		return value.split(',').map((tag) => tag.trim()).filter(Boolean)
	}

	return []
}

const maskAnonymousPost = (post) => {
	const plainPost = post?.toObject ? post.toObject() : post

	if (!plainPost || !plainPost.isAnonymous) {
		return plainPost
	}

	return {
		...plainPost,
		author: {
			...plainPost.author,
			username: 'Anonymous User',
			avatar: null,
		},
	}
}

const uploadImage = async (file) => {
	if (!file) {
		return null
	}

	const result = await uploadToCloudinary(file.buffer, file.originalname)
	return result.secure_url || result.url || null
}

const getPostQuery = (query) => {
	const mongoQuery = {}

	if (query.category) {
		mongoQuery.category = query.category
	}

	if (query.tag) {
		mongoQuery.tags = query.tag
	}

	if (query.q) {
		mongoQuery.$or = [
			{ content: { $regex: query.q, $options: 'i' } },
			{ category: { $regex: query.q, $options: 'i' } },
			{ tags: { $elemMatch: { $regex: query.q, $options: 'i' } } },
		]
	}

	return mongoQuery
}

const upsertReaction = (reactions, userId, type) => {
	const currentIndex = reactions.findIndex((reaction) => String(reaction.user) === String(userId))

	if (currentIndex >= 0) {
		if (reactions[currentIndex].type === type) {
			reactions.splice(currentIndex, 1)
			return reactions
		}

		reactions[currentIndex].type = type
		return reactions
	}

	reactions.push({ user: userId, type })
	return reactions
}

const createNotification = async ({ recipient, sender, type, post, message }) => {
	if (!recipient || String(recipient) === String(sender)) {
		return
	}

	await NotificationModel.create({ recipient, sender, type, post, message })
}

const postUserPopulate = [
	{ path: 'author.userId', select: 'username avatar' },
	{ path: 'comments.user', select: 'username avatar' },
]

// Public category list
userApp.get('/categories', (req, res) => {
	res.status(200).json({ categories })
})

// Public post feed
userApp.get('/posts', async (req, res, next) => {
		const posts = await PostModel.find(getPostQuery(req.query)).populate(postUserPopulate).sort({ createdAt: -1 })
		res.status(200).json({ posts: posts.map(maskAnonymousPost) })
})

// Search posts by keywords, tags, or category
userApp.get('/posts/search', async (req, res, next) => {
	const posts = await PostModel.find(getPostQuery(req.query)).populate(postUserPopulate).sort({ createdAt: -1 })
	res.status(200).json({ posts: posts.map(maskAnonymousPost) })
})

// Category-specific post feed
userApp.get('/categories/:category/posts', async (req, res, next) => {
		const posts = await PostModel.find({ category: req.params.category }).populate(postUserPopulate).sort({ createdAt: -1 })
		res.status(200).json({ posts: posts.map(maskAnonymousPost) })
})

// View a single post
userApp.get('/posts/:postId', async (req, res, next) => {
		const post = await PostModel.findByIdAndUpdate(
			req.params.postId,
			{ $inc: { views: 1 } },
			{ new: true }
		)
			.populate(postUserPopulate)

		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		res.status(200).json({ post: maskAnonymousPost(post) })
})

// Create a new post
userApp.post('/posts', verifyToken('USER', 'ADMIN'), upload.single('image'), async (req, res, next) => {
	const { content, category, tags, isAnonymous } = req.body

	if (!content || !category) {
		return res.status(400).json({ message: 'content and category are required' })
	}

		const currentUser = await UserModel.findById(req.user.userId)
		if (!currentUser) {
			return res.status(404).json({ message: 'User not found' })
		}

		const anonymous = parseBoolean(isAnonymous)
		const image = await uploadImage(req.file)

		const post = await PostModel.create({
			content,
			category,
			tags: parseTags(tags),
			isAnonymous: anonymous,
			image,
			author: {
				userId: currentUser._id,
				username: anonymous ? 'Anonymous User' : currentUser.username,
				avatar: anonymous ? null : currentUser.avatar || null,
			},
		})

		res.status(201).json({ message: 'Post created', post: maskAnonymousPost(post) })
})

// Edit an existing post owned by the current user
userApp.put('/posts/:postId', verifyToken('USER', 'ADMIN'), upload.single('image'), async (req, res, next) => {
		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		if (String(post.author.userId) !== String(req.user.userId)) {
			return res.status(403).json({ message: 'You can only edit your own post' })
		}

		const { content, category, tags, isAnonymous } = req.body

		if (content !== undefined) post.content = content
		if (category !== undefined) post.category = category
		if (tags !== undefined) post.tags = parseTags(tags)
		if (isAnonymous !== undefined) post.isAnonymous = parseBoolean(isAnonymous)
		if (req.file) post.image = await uploadImage(req.file)

		const currentUser = await UserModel.findById(req.user.userId)
		post.author = {
			userId: currentUser._id,
			username: post.isAnonymous ? 'Anonymous User' : currentUser.username,
			avatar: post.isAnonymous ? null : currentUser.avatar || null,
		}

		await post.save()
		res.status(200).json({ message: 'Post updated', post: maskAnonymousPost(post) })
})

// Delete a post owned by the current user
userApp.delete('/posts/:postId', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		if (String(post.author.userId) !== String(req.user.userId)) {
			return res.status(403).json({ message: 'You can only delete your own post' })
		}

		await post.deleteOne()
		res.status(200).json({ message: 'Post deleted' })
})

// Save a post to the user dashboard
userApp.post('/posts/:postId/save', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId)
		const post = await PostModel.findById(req.params.postId)

		if (!user || !post) {
			return res.status(404).json({ message: 'User or post not found' })
		}

		const alreadySaved = user.savedPosts.some((savedPost) => String(savedPost) === String(post._id))
		if (!alreadySaved) {
			user.savedPosts.push(post._id)
			await user.save()
		}

		res.status(200).json({ message: 'Post saved', savedPosts: user.savedPosts })
})

// Remove a post from saved posts
userApp.delete('/posts/:postId/save', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		user.savedPosts = user.savedPosts.filter((savedPost) => String(savedPost) !== String(req.params.postId))
		await user.save()

		res.status(200).json({ message: 'Saved post removed', savedPosts: user.savedPosts })
})

// Report a post for moderation
userApp.post('/posts/:postId/report', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { reason } = req.body
		if (!reason) {
			return res.status(400).json({ message: 'reason is required' })
		}

		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		post.reports.push({ reportedBy: req.user.userId, reason })
		await post.save()

		res.status(200).json({ message: 'Post reported' })
})

// Add a comment to a post
userApp.post('/posts/:postId/comments', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { content, isAnonymous } = req.body
		if (!content) {
			return res.status(400).json({ message: 'content is required' })
		}

		const post = await PostModel.findById(req.params.postId)
		const user = await UserModel.findById(req.user.userId)
		if (!post || !user) {
			return res.status(404).json({ message: 'User or post not found' })
		}

		post.comments.push({
			user: user._id,
			content,
			isAnonymous: parseBoolean(isAnonymous),
		})

		await post.save()
		await post.populate(postUserPopulate)

		await createNotification({
			recipient: post.author.userId,
			sender: user._id,
			type: 'comment',
			post: post._id,
			message: 'Someone commented on your post',
		})

		res.status(201).json({ message: 'Comment added', comments: post.comments })
})

// Edit the current user's comment
userApp.put('/posts/:postId/comments/:commentId', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { content } = req.body
		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		const comment = post.comments.id(req.params.commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		if (String(comment.user) !== String(req.user.userId)) {
			return res.status(403).json({ message: 'You can only edit your own comment' })
		}

		comment.content = content ?? comment.content
		await post.save()

		res.status(200).json({ message: 'Comment updated', comment })
})

// Delete the current user's comment
userApp.delete('/posts/:postId/comments/:commentId', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		const comment = post.comments.id(req.params.commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		if (String(comment.user) !== String(req.user.userId)) {
			return res.status(403).json({ message: 'You can only delete your own comment' })
		}

		comment.deleteOne()
		await post.save()

		res.status(200).json({ message: 'Comment deleted' })
})

// React to a post
userApp.post('/posts/:postId/react', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { type = 'like' } = req.body
		if (!reactionTypes.includes(type)) {
			return res.status(400).json({ message: 'Invalid reaction type' })
		}

		const post = await PostModel.findById(req.params.postId)
		const user = await UserModel.findById(req.user.userId)
		if (!post || !user) {
			return res.status(404).json({ message: 'User or post not found' })
		}

		const existingReaction = post.reactions.find((reaction) => String(reaction.user) === String(user._id))
		upsertReaction(post.reactions, user._id, type)
		await post.save()

		const wasRemoved = existingReaction?.type === type
		if (!wasRemoved && type === 'like') {
			await createNotification({
				recipient: post.author.userId,
				sender: user._id,
				type: 'reaction',
				post: post._id,
				message: `${user.username} liked your post`,
			})
		}

		res.status(200).json({ message: 'Reaction updated', reactions: post.reactions })
})

// Remove a reaction from a post
userApp.delete('/posts/:postId/react', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		post.reactions = post.reactions.filter((reaction) => String(reaction.user) !== String(req.user.userId))
		await post.save()

		res.status(200).json({ message: 'Reaction removed' })
})

// React to a comment
userApp.post('/posts/:postId/comments/:commentId/react', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { type = 'like' } = req.body
		if (!reactionTypes.includes(type)) {
			return res.status(400).json({ message: 'Invalid reaction type' })
		}

		const post = await PostModel.findById(req.params.postId)
		const user = await UserModel.findById(req.user.userId)
		if (!post || !user) {
			return res.status(404).json({ message: 'User or post not found' })
		}

		const comment = post.comments.id(req.params.commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		upsertReaction(comment.reactions, user._id, type)
		await post.save()

		await createNotification({
			recipient: comment.user,
			sender: user._id,
			type: 'reaction',
			post: post._id,
			message: 'Someone reacted to your comment',
		})

		res.status(200).json({ message: 'Comment reaction updated', reactions: comment.reactions })
})

// Report a comment for moderation
userApp.post('/posts/:postId/comments/:commentId/report', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { reason } = req.body
		if (!reason) {
			return res.status(400).json({ message: 'reason is required' })
		}

		const post = await PostModel.findById(req.params.postId)
		if (!post) {
			return res.status(404).json({ message: 'Post not found' })
		}

		const comment = post.comments.id(req.params.commentId)
		if (!comment) {
			return res.status(404).json({ message: 'Comment not found' })
		}

		if (!Array.isArray(comment.reports)) {
			comment.reports = []
		}

		comment.reports.push({ reportedBy: req.user.userId, reason })
		await post.save()

		res.status(200).json({ message: 'Comment reported' })
})

// View the current user's profile
userApp.get('/me', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId).select('-password')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ user })
})

// Update the current user's profile
userApp.patch('/me', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const { username, bio, avatar } = req.body
		if (username !== undefined) user.username = username
		if (bio !== undefined) user.bio = bio
		if (avatar !== undefined) user.avatar = avatar

		await user.save()

		res.status(200).json({ message: 'Profile updated', user: await UserModel.findById(req.user.userId).select('-password') })
})

// Change the current user's username
userApp.patch('/me/username', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { username } = req.body
		if (!username) {
			return res.status(400).json({ message: 'username is required' })
		}

		const user = await UserModel.findById(req.user.userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		user.username = username
		await user.save()

		res.status(200).json({ message: 'Username updated' })
})

// Change the current user's avatar
userApp.patch('/me/avatar', verifyToken('USER', 'ADMIN'), upload.single('avatar'), async (req, res, next) => {
		if (!req.file) {
			return res.status(400).json({ message: 'avatar file is required' })
		}

		const avatar = await uploadImage(req.file)
		const user = await UserModel.findById(req.user.userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		user.avatar = avatar
		await user.save()

		res.status(200).json({ message: 'Avatar updated', avatar })
})

// View saved posts
userApp.get('/me/saved-posts', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId).populate('savedPosts')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ savedPosts: user.savedPosts.map(maskAnonymousPost) })
})

// View mood history
userApp.get('/me/moods', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId).select('moodHistory')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ moods: user.moodHistory || [] })
})

// Add a daily mood entry
userApp.post('/moods', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const { mood, note = '' } = req.body
		if (!mood) {
			return res.status(400).json({ message: 'mood is required' })
		}

		const user = await UserModel.findById(req.user.userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		user.moodHistory.push({ mood, note })
		await user.save()

		res.status(201).json({ message: 'Mood entry added' })
})

// View mood statistics
userApp.get('/moods/stats', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const user = await UserModel.findById(req.user.userId).select('moodHistory')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const stats = (user.moodHistory || []).reduce((accumulator, entry) => {
			accumulator[entry.mood] = (accumulator[entry.mood] || 0) + 1
			return accumulator
		}, {})

		res.status(200).json({ stats })
})

// View notifications
userApp.get('/notifications', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const notifications = await NotificationModel.find({ recipient: req.user.userId }).sort({ createdAt: -1 })
		res.status(200).json({ notifications })
})

// Clear all notifications
userApp.delete('/notifications', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		await NotificationModel.deleteMany({ recipient: req.user.userId })
		res.status(200).json({ message: 'Notifications cleared' })
})

// Load dashboard summary data
userApp.get('/dashboard', verifyToken('USER', 'ADMIN'), async (req, res, next) => {
		const [profile, postCount, user] = await Promise.all([
			UserModel.findById(req.user.userId).select('-password'),
			PostModel.countDocuments({ 'author.userId': req.user.userId }),
			UserModel.findById(req.user.userId).select('savedPosts'),
		])

		if (!profile) {
			return res.status(404).json({ message: 'User not found' })
		}

		const unreadNotifications = await NotificationModel.countDocuments({ recipient: req.user.userId, isRead: false })

		res.status(200).json({
			profile,
			summary: {
				myPosts: postCount,
				savedPosts: user?.savedPosts?.length || 0,
				unreadNotifications,
			},
		})
})

// Get public user profile by ID
userApp.get('/users/:userId', async (req, res, next) => {
	try {
		const user = await UserModel.findById(req.params.userId).select('-password')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.status(200).json({ user })
	} catch (requestError) {
		res.status(400).json({ message: 'Invalid user ID' })
	}
})

// Get posts by a specific user
userApp.get('/users/:userId/posts', async (req, res, next) => {
	try {
		const posts = await PostModel.find({ 'author.userId': req.params.userId })
			.populate(postUserPopulate)
			.sort({ createdAt: -1 })

		res.status(200).json({ posts: posts.map(maskAnonymousPost) })
	} catch (requestError) {
		res.status(400).json({ message: 'Unable to load user posts' })
	}
})

