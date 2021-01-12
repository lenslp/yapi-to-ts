/* prettier-ignore-start */
/* tslint-disable */
/* eslint-disable */

/* 该文件由 end-type-to-front-type 自动生成，请勿直接修改！！！ */

// @ts-ignore
// prettier-ignore
import { Method, RequestBodyType, ResponseBodyType, RequestConfig, RequestFunctionRestArgs, FileData, prepare } from 'end-type-to-front-type'
import request from '@/utils/request'
// @ts-ignore

/**
 * 接口 [删除测试↗](http://yapi.uniubi.com:3000/project/16/interface/api/543)
 *
 * @分类 [测试分类↗](http://yapi.uniubi.com:3000/project/16/interface/api/cat_49)
 * @请求头 `DELETE /test/group/{groupId}/{id}`
 * @更新时间 `2021-01-12 16:10:19`
 */

/* **请求query类型** */
export interface DeleteGroupQuery {
  queryId: string
}

/* **请求params类型** */
export interface DeleteGroupParams {
  groupId: string
  id: string
}

/* **返回类型** */
export interface DeleteGroupResponse {}

/* **请求函数** */
export async function deleteGroup(
  query: DeleteGroupQuery,
  params: DeleteGroupParams,
): Promise<any> {
  return request(`test/group/${params.groupId}/${params.id}`, {
    method: Method.DELETE,
    params: query,
  })
}

/**
 * 接口 [考评组-根据考核单id查询_copy↗](http://yapi.uniubi.com:3000/project/16/interface/api/618)
 *
 * @分类 [测试分类↗](http://yapi.uniubi.com:3000/project/16/interface/api/cat_49)
 * @标签 `考评组设置接口 [1.0]`
 * @请求头 `GET /performance/group/info/queryGroupByAssessManageId_1610440738544`
 * @更新时间 `2021-01-12 16:39:04`
 */

/* **请求query类型** */
export interface GetQueryGroupByAssessManageId_1610440738544Query {
  /**
   * 考核单id
   */
  assessmentManageId?: string
}

/* **返回类型** */
/**
 * data
 */
export type GetQueryGroupByAssessManageId_1610440738544Response = {
  /**
   * 考核周期 1 月度 2 季度 3 半年度 4 年度 5 自定义
   */
  assessPeriod?: number
  /**
   * 考评组Id
   */
  groupId?: string
  /**
   * 考评组名称
   */
  groupName?: string
}[]

/* **请求函数** */
export async function getQueryGroupByAssessManageId_1610440738544(
  query: GetQueryGroupByAssessManageId_1610440738544Query,
): Promise<any> {
  return request(
    `/performance/group/info/queryGroupByAssessManageId_1610440738544`,
    {
      method: Method.GET,
      params: query,
    },
  )
}

/**
 * 接口 [指标分类-查询所有指标分类_copy↗](http://yapi.uniubi.com:3000/project/16/interface/api/638)
 *
 * @分类 [测试分类↗](http://yapi.uniubi.com:3000/project/16/interface/api/cat_49)
 * @标签 `考核设置基础设置接口 [1.0]`
 * @请求头 `GET /performance/baseinstall/queryAllNormSort_1610446575153`
 * @更新时间 `2021-01-12 18:16:18`
 */

/* **返回类型** */
/**
 * data
 */
export type GetQueryAllNormSort_1610446575153Response = {
  /**
   * 考核维度
   * 1 指标分类
   * 2 项目专项
   */
  assessAngle?: string
  /**
   * 指标分类Id
   */
  normSortId?: string
  /**
   * 指标分类类型 业务、价值观、其他等
   */
  normSortType?: string
}[]

/* **请求函数** */
export async function getQueryAllNormSort_1610446575153(): Promise<any> {
  return request(`/performance/baseinstall/queryAllNormSort_1610446575153`, {
    method: Method.GET,
  })
}

/* prettier-ignore-end */
