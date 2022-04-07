/**
 * @file: 页面顶部
 * @author: longyangyang
 */

 import '@ant-design/compatible/assets/index.css';
 import './pageFoot.less';
 export default function SuccessContent(props) {
     return (
        <div className='page-foot'>
            <div className='page-foot-left'>
                {props.pageFootLeft}
            </div>
            <>
                {props.pageFootRight}
            </>
                
        </div>
     )
 }