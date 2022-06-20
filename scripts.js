const container = document.querySelector('#container');
const fileInput = document.querySelector('#file-input');


async function loadTrainingData() {
	const labels = ['Hải Yến', 'Lê Bảo Bình', 'UI']

	const faceDescriptors = []
	for (const label of labels) {
		const descriptors = []
		for (let i = 1; i <= 4; i++) {
			const image = await faceapi.fetchImage(`/data/${label}/${i}.png`)// lấy ảnh ra 
			const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()// lấy các mô tả điểm ảnh
			descriptors.push(detection.descriptor)
		}
		faceDescriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptors))
		Toastify({
			text: `Training xong data của ${label}!`
		}).showToast();
	}

	return faceDescriptors
}

let faceMatcher
async function init() {
	await Promise.all([// load các mã nhận diện ảnh
		faceapi.loadSsdMobilenetv1Model('/models'),
		faceapi.loadFaceRecognitionModel('/models'),
		faceapi.loadFaceLandmarkModel('/models'),
	])


	Toastify({
		text: "Tải xong model nhận diện!",
	}).showToast();

	const trainingData = await loadTrainingData()// lấy ảnh và mô tả ảnh
	faceMatcher = new faceapi.FaceMatcher(trainingData, 0.6)// so sánh mức 0.6 , mức càng thấp độ nhận diện càng chính xác nhưng cũng khó nhân diện ảnh dk ảnh phải nét

	console.log(faceMatcher)
	document.querySelector("#loading").remove();
}

init()

fileInput.addEventListener('change', async () => {
	const files = fileInput.files;

	const image = await faceapi.bufferToImage(files[0]);// lấy ảnh từ input
	const canvas = faceapi.createCanvasFromMedia(image);//tao thẻ canvas

	container.innerHTML = ''
	container.append(image);
	container.append(canvas);

	const size = {
		width: image.width,
		height: image.height
	}

	faceapi.matchDimensions(canvas, size)

	const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()// lấy mô tả ảnh từ input
	const resizedDetections = faceapi.resizeResults(detections, size)// set size

	// faceapi.draw.drawDetections(canvas, resizedDetections)


	for (const detection of resizedDetections) {// so sánh mô tả ảnh từ input và so với trong data
		const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
			label: faceMatcher.findBestMatch(detection.descriptor).toString()
		})
		drawBox.draw(canvas)
	}
})