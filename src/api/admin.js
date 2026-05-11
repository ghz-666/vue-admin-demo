import request from "../utils/request";
export function login(data) {
    return request.post('/user/login', data)
}
export function categoryTree() {
    return request.get('/knowledge/category/tree')
}
export function articlePage(params) {
    return request.get('/knowledge/article/page', { params })
}
export function uploadFile(file,businessInfo) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessType', 'ARTICLE')
    formData.append('businessId', businessInfo.businessId)
    formData.append('businessField', 'cover')

    return request.post('/file/upload', formData,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}
export function addArticle(data) {
    return request.post('/knowledge/article', data)
}
export function updateArticle(data) {
    return request.put(`/knowledge/article/${data.id}`, data)
}
export function getarticleDetail(id) {
    return request.get(`/knowledge/article/${id}`)
}
// 修改文章状态
export function updateArticleStatus(id, status) {
  return request.put(`/knowledge/article/${id}/status`, { status })
}
export function changeArticleStatus(id, data) {
  return request.put(`/knowledge/article/${id}/status`, data)
}
export function deleteArticle(id) {
    return request.delete(`/knowledge/article/${id}`)
}
export function GetConsultCategories(params) {
    return request.get('/psychological-chat/sessions', { params })  
}
export function GetSessionDetail(sessionId) {
    return request.get(`/psychological-chat/sessions/${sessionId}/messages`)  
}
export function GetEmotionPage(params) {
    return request.get(`/emotion-diary/admin/page`, { params })  
}
export function GetAnalyticFunction(id) {
    return request.get(`/data-analytics/overview`)  
}