export type UniqueID = string & { readonly __brand: 'UniqueID' };

// http://byronsalau.com/blog/how-to-create-a-guid-uuid-in-javascript/
export const newID = (): UniqueID => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, function (c) {
		// tslint:disable-next-line:no-bitwise
		const r = Math.trunc(Math.random() * 16);
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	}) as UniqueID;
};
