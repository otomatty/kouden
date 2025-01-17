export type InvitationErrorCode =
	| "INVITATION_NOT_FOUND"
	| "INVITATION_EXPIRED"
	| "INVITATION_USED"
	| "MAX_USES_EXCEEDED"
	| "ALREADY_MEMBER"
	| "UNAUTHORIZED"
	| "INTERNAL_ERROR";

export class InvitationError extends Error {
	constructor(
		public code: InvitationErrorCode,
		message: string,
	) {
		super(message);
		this.name = "InvitationError";
	}
}
