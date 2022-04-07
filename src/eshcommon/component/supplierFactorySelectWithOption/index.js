/**
 * @file:   供应商下拉选择框，点击搜索按钮显示下拉框
 * @author: pengli
 *
 */

import React, {useEffect, useRef, useState} from 'react';
import {Button, Divider, Select} from 'antd';
import {PlusOutlined, SearchOutlined} from '@ant-design/icons';
import './index.css';
import axiosForCommon from 'component/axiosForCommon';
import LbwJsUtils from 'component/LbwJsUtils';

const Option = Select.Option;

export default function SupplierFactorySelect(props) {
    const [value, setValue] = useState('');
    const [listSize, setListSize] = useState(0);
    const [viewIndex, setViewIndex] = useState(0);
    const [viewSize] = useState(20);
    const [supplierFactoryList, setSupplierFactoryList] = useState([]);
    const [searchStr, setSearchStr] = useState('');
    const showSearchBar = useRef(null);

    useEffect(() => {
        getSupplierFactoryList({flag: true});
    }, []);

    /**
     * 分页获取当前登录账号可访问供应商列表
     * @return {[type]} [description]
     */
    function getSupplierFactoryList({flag, isSearch, _viewIndex, _searchStr, isNotSetValue}) {
        let inputFields = {
            statusId: 'PARTY_ENABLED'
        };

        inputFields = {...inputFields, groupName: isSearch ? _searchStr : searchStr};
        let param = {
            inputFields: JSON.stringify(inputFields),
            viewIndex: isSearch ? 0 : (_viewIndex || viewIndex),
            viewSize: isSearch ? 20 : viewSize
        }
        axiosForCommon('findSupplierFactorySvcs', param, result => {
            let _supplierFactoryList = [];
            if (isSearch) {
                _supplierFactoryList = result.list;
            } else {
                _supplierFactoryList = supplierFactoryList.concat(result.list);
            }
            let _supplierFactory = value || (isNotEmpty(_supplierFactoryList) ? _supplierFactoryList[0].partyId : '');
            if (!isNotSetValue) {
                setValue(_supplierFactory);
            }
            setSupplierFactoryList(_supplierFactoryList);
            setListSize(result.listSize);
            if (flag) {
                props.callBack && props.callBack(_supplierFactory, true);
            }
        }, error => {
            LbwJsUtils.notification(error);
        })
    }

    function handleSearch(_searchStr) {
        setSearchStr(_searchStr || '');
        getSupplierFactoryList({isSearch: true, _searchStr: _searchStr || ''})
    }

    function handleChangeSupplierFactory(value) {
        setValue(value);
        props.callBack && props.callBack(value || '', true);
    }

    function loadMoreSupplierFactory() {
        let _viewIndex = viewIndex + 1;
        setViewIndex(_viewIndex);
        getSupplierFactoryList({_viewIndex});
    }

    function clickSearchBtn() {
        showSearchBar.current = !showSearchBar.current;
        let searchContainer = $('.map-search-container');
        if (showSearchBar.current) {
            searchContainer.animate({
                opacity: 1,
                top: 0,
                width: 220,
                zIndex: 110
            });
        } else {
            searchContainer.animate({
                opacity: 0,
                top: 0,
                width: props.placement === 'left' ? 220 : 0,
                zIndex: 90
            });
        }
    }

    function getSupplierSelectComponent() {
        return (
            <div className={`map-search-container ${!props.hideBtn && (props.placement === 'left' ? 'border-right-none' : 'border-left-none')}`} style={{opacity: props.hideBtn ? 1 : 0}}>
                <Select
                    value={value}
                    showSearch
                    placeholder={i18n.SupplierFactory}
                    optionFilterProp={'children'}
                    onChange={handleChangeSupplierFactory}
                    onSearch={handleSearch}
                    filterOption={false}
                    onSelect={() => {
                        // 不重新设置供应商
                        if (searchStr) {
                            setSearchStr('');
                            getSupplierFactoryList({isSearch: true, _searchStr: '', isNotSetValue: true})
                        }
                    }}
                    dropdownRender={menu => (
                        <div>
                            {menu}
                            <Divider style={{margin: '4px 0'}}/>
                            {
                                listSize === supplierFactoryList.length ?
                                    <div style={{padding: '4px 8px'}}>
                                        <PlusOutlined/> {i18n.CommonMore}</div>
                                    :
                                    <div
                                        style={{padding: '4px 8px', cursor: 'pointer'}}
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={loadMoreSupplierFactory}>
                                        <a><PlusOutlined/> {i18n.CommonMore}</a>
                                    </div>
                            }
                        </div>
                    )}>
                    {
                        supplierFactoryList.map(item => (
                            <Option value={item.partyId}
                                key={item.partyId}>{item.groupName}</Option>
                        ))
                    }
                </Select>
            </div>
        );
    }

    return (
        <div className={`map-search-btn ${props.className}`}>
            {
                !props.hideBtn &&
                <Button style={{width: 28, height: 28, padding: 0}}
                    onClick={clickSearchBtn}>
                    <SearchOutlined style={{fontSize: 14}}/>
                </Button>
            }
            {getSupplierSelectComponent()}
        </div>
    );
}