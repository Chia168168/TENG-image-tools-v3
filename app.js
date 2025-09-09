document.addEventListener('DOMContentLoaded', function() {
  // 獲取DOM元素
  const fileInput = document.getElementById('file-input');
  const uploadSection = document.querySelector('.upload-section');
  const statusMessage = document.getElementById('status-message');
  const previewSection = document.getElementById('preview-section');
  const originalPreview = document.getElementById('original-preview');
  const convertedPreview = document.getElementById('converted-preview');
  const startCropBtn = document.getElementById('start-crop-btn');
  const cropSection = document.getElementById('crop-section');
  const cropContainer = document.getElementById('crop-container');
  const applyCropBtn = document.getElementById('apply-crop-btn');
  const resetCropBtn = document.getElementById('reset-crop-btn');
  const downloadBtn = document.getElementById('download-btn');
  const resultSection = document.getElementById('result-section');
  const finalResult = document.getElementById('final-result');
  const newImageBtn = document.getElementById('new-image-btn');
  const finalDownloadBtn = document.getElementById('final-download-btn');
  
  // 狀態變量
  let convertedImageUrl = null;
  let currentImage = null;
  let cropper = null;
  let croppedImageUrl = null;
  
  // 拖放功能
  uploadSection.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.style.borderColor = '#2980b9';
    uploadSection.style.backgroundColor = '#d6eaf8';
  });
  
  uploadSection.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.style.borderColor = '#3498db';
    uploadSection.style.backgroundColor = '#ecf0f1';
  });
  
  uploadSection.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.style.borderColor = '#3498db';
    uploadSection.style.backgroundColor = '#ecf0f1';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect(files[0]);
    }
  });
  
  // 文件選擇處理
  uploadSection.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
  
  // 處理選擇的文件
  async function handleFileSelect(file) {
    clearPreviousData();
    showStatus('loading', '處理中，請稍候...');
    
    try {
      // 檢查是否為HEIC/HEIF格式
      const isHeic = await HeicTo.isHeic(file);
      
      if (isHeic) {
        showStatus('loading', '正在轉換HEIC圖片...');
        
        // 轉換HEIC到JPEG
        const jpegBlob = await HeicTo({
          blob: file,
          type: 'image/jpeg',
          quality: 0.8
        });
        
        convertedImageUrl = URL.createObjectURL(jpegBlob);
        originalPreview.src = URL.createObjectURL(file);
        convertedPreview.src = convertedImageUrl;
        currentImage = convertedImageUrl;
        
        showStatus('success', '轉換成功！');
        previewSection.style.display = 'block';
      } else {
        showStatus('error', '請上傳HEIC/HEIF格式的圖片');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      showStatus('error', '處理圖片時發生錯誤: ' + error.message);
    }
  }
  
  // 開始裁剪
  startCropBtn.addEventListener('click', function() {
    if (!convertedImageUrl) return;
    
    previewSection.style.display = 'none';
    cropSection.style.display = 'block';
    
    // 初始化裁剪工具
    const cropImage = document.createElement('img');
    cropImage.id = 'crop-image';
    cropImage.src = convertedImageUrl;
    cropImage.style.display = 'block';
    cropImage.style.maxWidth = '100%';
    
    cropContainer.innerHTML = '';
    cropContainer.appendChild(cropImage);
    
    // 等待圖片載入完成後初始化Cropper.js
    cropImage.onload = function() {
      cropper = new Cropper(cropImage, {
        aspectRatio: NaN, // 自由比例
        viewMode: 1,
        guides: true,
        movable: true,
        zoomable: true,
        rotatable: true,
        scalable: true,
        autoCrop: true, // 確保自動顯示裁剪框
        autoCropArea: 1 // 讓裁剪框預設覆蓋整個圖片
      });
    };
  });
  
  // 應用裁剪
  applyCropBtn.addEventListener('click', function() {
    if (!cropper) return;
    
    // 獲取裁剪後的canvas
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    
    // 轉換為Blob
    canvas.toBlob(function(blob) {
      // 釋放之前的URL
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
      
      croppedImageUrl = URL.createObjectURL(blob);
      finalResult.src = croppedImageUrl;
      
      cropSection.style.display = 'none';
      resultSection.style.display = 'block';
    }, 'image/jpeg', 0.9);
  });
  
  // 重置裁剪
  resetCropBtn.addEventListener('click', function() {
    if (cropper) {
      cropper.reset();
    }
  });
  
  // 下載圖片 (在裁剪頁面)
  downloadBtn.addEventListener('click', function() {
    if (!croppedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = croppedImageUrl;
    link.download = 'cropped-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // 下載最終結果圖片
  finalDownloadBtn.addEventListener('click', function() {
    if (!croppedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = finalResult.src;
    link.download = 'final-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // 處理新圖片
  newImageBtn.addEventListener('click', function() {
    resultSection.style.display = 'none';
    uploadSection.style.display = 'flex';
    clearPreviousData();
  });
  
  // 顯示狀態消息
  function showStatus(type, message) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add(type);
    statusMessage.style.display = 'block';
  }
  
  // 清除之前的數據
  function clearPreviousData() {
    // 釋放URL對象
    if (convertedImageUrl) {
      URL.revokeObjectURL(convertedImageUrl);
      convertedImageUrl = null;
    }
    
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
      croppedImageUrl = null;
    }
    
    // 清除預覽
    originalPreview.src = '';
    convertedPreview.src = '';
    finalResult.src = '';
    
    // 隱藏部分
    previewSection.style.display = 'none';
    cropSection.style.display = 'none';
    resultSection.style.display = 'none';
    statusMessage.style.display = 'none';
    
    // 銷毀Cropper實例
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  }
});