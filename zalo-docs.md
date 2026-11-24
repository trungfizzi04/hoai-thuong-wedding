Tổng quan
Cung cấp một cách thức để ứng dụng của bạn có thể truy cập dữ liệu trên nền tảng của Zalo. Thông qua giao thức HTTP ứng dụng có thể truy vấn dữ liệu người dùng, dữ liệu bạn bè, đăng tin mới và nhiều tác vụ khác. Để sử dụng Social API bạn cần phải tạo ứng dụng trên Zalo Platform (Click vào avatar ở góc trên bên phải màn hình và chọn "Thêm ứng dụng mới") và tuân thủ các điều khoản do Zalo phát hành. Hệ thống Social API chỉ hoạt động trên giao thức TLS 1.2 trở lên đảm bảo tính an toàn và bảo mật.

Các khái niệm
Social API sử dụng phương thức xác thực OAuth2 để xác thực người dùng với một số định nghĩa cơ bản như sau: Trong đó:

OAuth Code: Là đoạn mã xác thực phân quyền cho ứng dụng của bên thứ 3 được Zalo tạo ra sau khi user login và cấp quyền thành công.
Access Token: là mã chứng nhận để được truy cập các thông tin được bảo vệ. Ứng dụng sẽ sử dụng đoạn mã này để gọi Open API.
Sử dụng Social API
Chỉ cần tạo yêu cầu HTTP GET/POST tới endpoint phù hợp là bạn có thể truy xuất thông tin từ Zalo bằng Social API. Chẳng hạn, nếu muốn truy xuất thông tin về người dùng hiện tại, bạn sẽ tạo yêu cầu HTTP GET như sau:

https://graph.zalo.me/v2.0/me?accesstoken={...}&fields=[...]

Sử dụng tham số 'fields'
Mặc định API sẽ không trả về hết các dữ liệu có thể mà chỉ trả một số field nhất định. Tùy thuộc vào nhu cầu sử dụng ứng dụng có thể request thêm các data cần thiết với tham số fields. Chúng tôi khuyến khích ứng dụng chỉ lấy những dữ liệu cần thiết để đảm bảo tốc độ xử lý và tiết kiệm băng thông cho người dùng.

Phân trang
Với API lấy một danh sách chúng tôi định nghĩa 2 tham số xác định vị trí hiện tại muốn lấy offset  và số phần tử muốn lấy limit. Với mỗi kết quả trả về chúng tôi sẽ thêm vào 1 giá trị paging để ứng dụng của bạn có thể request tới page tiếp theo hoặc page trước đó một cách dễ dàng hơn. Format trả về được định nghĩa như sau:

"data": [
    { "response data" },
],
"paging": {
    "next": "link to next page with same data",
    "previous": "link to previous page with same data",
},
"summary": {
    "total_count": ["total item"]
}

Chú ý: Phần data có thể sẽ có số phần tử  ít hơn số limit ứng dụng request. Số phần tử tối đa mỗi request sẽ được giới hạn tùy thuộc vào API.

Bạn có thể tìm hiểu thêm bằng cách bắt đầu nhanh hoặc thông tin chi tiết các API khác ở mục tài liệu.

Thông tin tên, ảnh đại diện
Dùng để truy xuất thông tin cơ bản của người dùng Zalo đã cấp quyền cho ứng dụng. Endpoint /me sẽ gửi về thông tin của người dùng ứng với access_token truyền vào.

Giới hạn truy xuất: Không giới hạn.
URL: https://graph.zalo.me/v2.0/me
Method: GET
Reponse Type: text/json
Ví dụ
curl \
-X GET \
-H 'access_token: <your_access_token>' \
"https://graph.zalo.me/v2.0/me?fields=id,name,picture"

Tham số header
Tham số	Kiểu dữ liệu	Tính bắt buộc	Mô tả
access_token	string	yes	Xem hướng dẫn lấy access_token ở đây.
Tham số
Tham số	Kiểu dữ liệu	Tính bắt buộc	Mô tả
fields	string	yes	Các trường thông tin muốn lấy, viết liền cách nhau bởi dấu phẩy.

VD: id, name, picture
Kết quả
Nếu request thành công json trả về có định dạng như sau:

{
    "error": 0,
    "message": "Success",
    "id": "UserId",
    "name": "User Name",
    "picture": {
        "data": {
            "url": "User avatar url"
        }
    }
}

Thuộc tính	Mô tả
error
Integer	Mã lỗi
message
String	Mô tả cho mã lỗi
id
String	Mã người dùng. Chuỗi này là duy nhất cho mỗi người dùng trên mỗi ứng dụng. Các ứng dụng khác nhau sẽ không dùng được mã người dùng của nhau.
picture
String	Ảnh đại diện người dùng. Mặc định kích thước ảnh trả về trong URL sẽ là ảnh nhỏ nhất.
Ứng dụng của bạn có thể request ảnh lớn hơn bằng cách thêm vào field picture node type (small, normal, large).
Ví dụ: picture.type(large)
name
String	Tên hiển thị của người dùng.
is_sensitive
boolean	
Có 2 giá trị:

true: tài khoản này thuộc nhóm người dùng cần nhà phát triển ứng dụng xác minh và áp dụng các cơ chế xử lý dữ liệu phù hợp theo quy định Pháp luật, có thể bao gồm nhưng không giới hạn người đã chết hoặc mất tích, người không biết chữ, người khuyết tật, trẻ em,…
false: tài khoản này thuộc nhóm người dùng bình thường
Lỗi thường gặp
Mã lỗi	Mô tả lỗi
210	User not visible
Tham khảo mã lỗi đầy đủ tại đây.

Trước

Cơ chế hết hạn của User Refresh Token
Giới thiệu
User Refresh Token là thông tin cần để lấy User Access Token mới trong trường hợp User Access Token đã hết hạn.

User Refresh Token sẽ có thời gian hiệu lực tối đa là 30 ngày (tức 720 giờ) và Refresh Token mới sẽ kế thừa thời gian hiệu lực của Refresh Token dùng để tạo ra nó. Trong trường hợp Refresh Token hết hạn, bạn phải thực hiện lại bước yêu cầu user cấp quyền cho Ứng dụng

Khi bạn dùng 1 Refresh Token để lấy 1 bộ Token mới, thời gian hiệu lực của Access Token vẫn là 1 giờ, nhưng thời gian hiệu lực của Refresh Token sẽ là thời gian hiệu lực còn lại của Refresh Token truyền vào. VD:
Tại thời điểm 0 giờ: OAuth Code được dùng để lấy Access Token 1 (hiệu lực: 1 giờ) và Refresh Token 1 (hiệu lực: 720 giờ)
Tại thời điểm 1 giờ: Refresh Token 1 được dùng để lấy Access Token 2 (hiệu lực: 1 giờ) và Refresh Token 2 (hiệu lực: 719 giờ)
Tại thời điểm 2 giờ: Refresh Token 2 được dùng để lấy Access Token 3 (hiệu lực: 1 giờ) và Refresh Token 3 (hiệu lực: 718 giờ)
....User Access Token V4
Yêu cầu cấp mới OAuth Code
Để sử dụng hệ thống Social API, ứng dụng của bạn cần được cấp quyền bằng cách lấy mã access token (mã truy cập) từ User. Ứng dụng cần thực hiện các bước cấu hình ban đầu để có thể lấy access token. Bạn có thể xem hướng dẫn cấu hình ban đầu bên dưới.

Trước khi thực hiện các bước bên dưới, bạn cần chú ý đến Một số lưu ý với User Access Token V4.

Bước 1: Cấu hình thông tin đăng nhập
Callback URL là nơi bạn sẽ phải thực hiện xử lý để nhận được authorization code. Trình duyệt sẽ chuyển hướng User đến địa chỉ này sau khi quá trình ủy quyền từ phía User hoàn tất. Vui lòng cấu hình Callback URL tại trang Quản lý ứng dụng -> mục Đăng nhập


Bước 2: Tạo code verifier và code challenge
Zalo sử dụng code challenge và code verifier (theo phương thức PKCE) để tăng độ bảo mật của quá trình xác thực và ủy quyền. Xem thêm về PKCE tại đây. Sau khi cấu hình Đăng nhập, bạn cần:

Tạo một code verifier và lưu trữ trên hệ thống của bạn.
Dùng mã hóa code verifier bằng bộ ký tự ASCII, tiếp đến dùng giải thuật SHA-256 để tạo mã băm, sau cùng encode Base64 (without Padding) mã băm để tạo ra code challenge từ code verifier.
code_challenge = Base64.encode(SHA-256.hash(ASCII(code_verifier)))
Lưu ý: 

Yêu cầu sử dụng code verifier khác nhau cho từng request.
Code verifier là 1 chuỗi bất kỳ, format có đủ chữ hoa, chữ thường, số và dài 43 ký tự.
Code verifier là code dùng để xác minh quyền sở hữu của bạn với authorization code bạn nhận được từ hệ thống. Vui lòng không cung cấp code này cho bên thứ ba.
Hãy dùng biến state hoặc một param tự định nghĩa truyền vào redirect_uri ở bước 3 để xác định authorization code mà bạn nhận được ứng với code verifier nào.
Bước 3: Yêu cầu cấp authorization code
Gửi đường dẫn dưới đây đến user để bắt đầu quá trình nhận authorization code. 

Web:
https://oauth.zaloapp.com/v4/permission?app_id=<APP_ID>&redirect_uri=<CALLBACK_URL>&code_challenge=<CODE_CHALLENGE>&state=<STATE>


Trong đó: oauth.zaloapp.com/v4/permission  là API Authorization Endpoint với các tham số

Tham số	Kiểu dữ liệu	Tính bắt buộc 	Mô tả 
app_id	long	yes	ID của ứng dụng. 
redirect_uri	string	yes	Thông tin được cấu hình tại bước 1.
code_challenge 	string	no	code challenge được tạo từ code verifier với giải thuật SHA-256 tại bước 2.
state	string	yes	Dùng để chống CSRF. Được trả nguyên vẹn trong redirect_uri.
Android:
https://oauth.zaloapp.com/v4/permission?app_id=<APP_ID>&pkg_name=<PKG_NAME>&sign_key=<SIGN_KEY>&code_challenge=<CODE_CHALLENGE>&state=<STATE>


Trong đó: oauth.zaloapp.com/v4/permission  là API Authorization Endpoint với các tham số

Tham số	Kiểu dữ liệu	Tính bắt buộc 	Mô tả 
app_id	long	yes	ID của ứng dụng. 
pkg_name	string	yes	Thông tin được cấu hình tại bước 1.
sign_key 	string	yes	Thông tin được cấu hình tại bước 1.
os	string	yes	Truyền vào giá trị: 1 - Mục đích thông báo cho platform biết để check các trường được config cho login Android.
code_challenge 	string	no	code challenge được tạo từ code verifier với giải thuật SHA-256 tại bước 2.
state	string	yes	Dùng để chống CSRF. Được trả nguyên vẹn trong redirect_uri.
IOS:
https://oauth.zaloapp.com/v4/permission?app_id=<APP_ID>&bndl_id=<BNDL_ID>&code_challenge=<CODE_CHALLENGE>&state=<STATE>


Trong đó: oauth.zaloapp.com/v4/permission  là API Authorization Endpoint với các tham số

Tham số	Kiểu dữ liệu	Tính bắt buộc 	Mô tả 
app_id	long	yes	ID của ứng dụng. 
bndl_id	string	yes	Thông tin được cấu hình tại bước 1.
os	string	yes	Truyền vào giá trị: 2 - Mục đích thông báo cho platform biết để check các trường đượ config cho login IOS.
code_challenge 	string	no	code challenge được tạo từ code verifier với giải thuật SHA-256 tại bước 2.
state	string	yes	Dùng để chống CSRF. Được trả nguyên vẹn trong redirect_uri.
Đường dẫn sẽ mở trang cấp quyền cho ứng dụng, như sau:


Tại đây, User sẽ chọn “Cho phép” để xác nhận gửi oauth code. Trình duyệt sẽ chuyển hướng và gửi oauth_code về callback URL đã được thiết lập trước đó (callback URL của bạn sẽ nhận được 1 HTTP get request có kèm oauth code). Ví dụ: callback URL của bạn là https://yourdomain.com/abc. HTTP get request sẽ gọi đến callback URL là:

https://yourdomain.com/abc?code=<AUTHORIZATION_CODE>&state=xxxx&code_challenge=xxxx

*Lưu ý:  code sẽ có hiệu lực trong vòng 10 phút.

Bước 4: Gửi API để lấy user access token từ authorization code
Sử dụng API sau để lấy access token từ authorization code mà bạn nhận được.

HTTP request

URL:  https://oauth.zaloapp.com/v4/access_token 
Method: POST
Content Type: application/x-www-form-urlencoded
Response Type:  json
Example request

curl \
-X POST \
-H "Content-Type: application/x-www-form-urlencoded" \
-H "secret_key: <your_secret_key>" \
--data-urlencode 'code=<your_oauth_code>' \
--data-urlencode 'app_id=<your_app_id>' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'code_verifier=your_code_verifier' \
'https://oauth.zaloapp.com/v4/access_token'

Header

HeaderName	Kiểu dữ liệu	Tính bắt buộc	Mô tả
secret_key	string	yes 	Khóa bí mật của ứng dụng (*). Xem hướng dẫn tại đây
Body x-www-form-urlencoded

Key	Kiểu dữ liệu	Tính bắt buộc	Mô tả
code	string	yes	Authorization code mà bạn nhận được ở bước 3
app_id	long	yes	ID của ứng dụng
grant_type 	string	yes	Thuộc tính cho biết thông tin để tạo access token. Giá trị truyền vào: authorization_codeđại diện cho việc tạo access token từ authorization code.
code_verifier	string	yes nếu ở bước lấy oauth code có truyền code challenge	Code verifier được dùng để tạo code challenge ở bước 2.
Ví dụ:


Example respond

{
    "access_token": "RfBh5NdqsWzhcX8bDDe_1A463Z34Fhy1GVi63AoTU1InwujqF",
    "refresh_token":"L2Y2BO9Prn_I1SkM08T4J99bZQYVbOBPfTVeRgrLdPK4ZqGX9G",
    "expires_in": "3600",
        "refresh_token_expires_in: string


Thuộc tính	Kiểu dữ liệu	Mô tả
access_token	string	Access token dùng để gọi các Official Account API Hiệu lực: 1 giờ
refresh_token	string	Token được sử dụng để tạo lại access token khi access token hết hiệu lực.Mỗi access token được tạo sẽ có một refresh token đi kèm.Hiệu lực tối đa: 30 ngày
expires_in	string	Thời hạn của access token (đơn vị tính: giây)
Lấy user access token từ refresh token
HTTP request

URL:  https://oauth.zaloapp.com/v4/access_token
Method: POST
Content Type: application/x-www-form-urlencoded
Response Type:  json
Example request

curl \
-X POST \
-H "Content-Type: application/x-www-form-urlencoded" \
-H "secret_key: <your_secret_key>" \
--data-urlencode 'refresh_token=<your_refresh_token>' \
--data-urlencode 'app_id=<your_app_id>' \
--data-urlencode 'grant_type=refresh_token' \
'https://oauth.zaloapp.com/v4/access_token'

Header

HeaderName	Kiểu dữ liệu	Tính bắt buộc	Mô tả
secret_key	string	yes	Khóa bí mật của ứng dụng (*). Xem hướng dẫn tại đây
Body x-www-form-urlencode

Key	Kiểu dữ liệu	Tính bắt buộc	Mô tả
refresh_token	string	yes	Refresh token dùng để tạo access token mới.
app_id	long	yes	ID của ứng dụng.
grant_type 	string	yes	Thuộc tính cho biết thông tin để tạo access token. Giá trị nhận vào: refresh_tokenĐại diện cho việc 1tạo access token từ refresh token.
Ví dụ:


Example respond

{
    "access_token":"E5sPAxHWmF9aYZeZzPczEcNRtdVIPCD3XyGXw1uLBZ3npsF-MUW",
    "refresh_token": "DCcFKjWctu458dAU2FRbaNRPCcQGZ34zCmUF9aYEcNRtdVIaq",
    "expires_in": "3600",
        "refresh_token_expires_in: string
}

Thuộc tính	Kiểu dữ liệu	Mô tả
access_token	string	Access token dùng để gọi các Official Account APIHiệu lực: 1 giờ
refresh_token	string	Token được sử dụng để tạo lại access token khi access token hết hiệu lực. Mỗi access token được tạo sẽ có một refresh token đi kèm.Hiệu lực tối đa: 30 ngày
expires_in	string	Thời hạn của access token (đơn vị tính: giây)
*Lưu ý:  Trường hợp refresh token hết hạn, bạn cần thực hiện yêu cầu cấp lại authorization code và access token theo hướng dẫn tại bước 3 và 4.

So sánh giữa oauth v2 và oauth v4
Thực thể	Oauth V2	Oauth V4
OAuth Code	
Hiệu lực: 3 tháng
Số lần được sử dụng để gọi lấy access token: Vô hạn
Hiệu lực: 10 phút
Số lần được sử dụng để gọi lấy access token: 1 lần
Access Token	
Hiệu lực: 1 tiếng
Khi hết hiệu lực, dùng oauth code để lấy access token mới
Hiệu lực: 1 tiếng
Khi hết hiệu lực, dùng refresh token để lấy access token mới
Hướng dẫn lấy app secret key


Một số lưu ý với User Access Token V4
Với phương thức lấy access token v4, authorization code sẽ được trả về qua callback URL. Sử dụng code này để gọi API lấy access token và refresh token.
Lưu ý quan trọng về bảo mật: Tính năng PKCE là bắt buộc đối với ứng dụng không hiện thực Server Side. Vui lòng tắt tính năng check App Secret Key tại Trang setting app -> Mục Đăng nhập, để tính năng PKCE là bắt buộc

Lưu ý ứng dụng cần nên ở trạng thái Đang hoạt động

Hướng dẫn lấy app secret key
